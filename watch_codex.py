#!/usr/bin/env python3
"""Codex 進度巡檢 watcher（stdlib only，不呼叫模型）。

預設 --dry-run（只記決策）。--live 才會寫 wake.json；
--auto-restart（需搭配 --live）才會在行程消失且任務未完成時重啟單一 writer。

鎖定：以 flock 保證同時只有一個 watcher。
凍結／重開：用上次成功檢查時間與 boot_id 偵測牆鐘缺口，
stall 需同時看 log／進度檔 mtime 與 CPU，不用心跳年齡單獨判定。
"""
from __future__ import annotations

import argparse
import fcntl
import glob
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime

PROJ = "/workspace/history-map"
TASK = "TASK24.md"
LOG_PREFIX = "codex24"
DIR = os.path.expanduser("~/.cache/codex_watch")
STATE = os.path.join(DIR, "state.json")
LOG = os.path.join(DIR, "watch.log")
WAKE = os.path.join(DIR, "wake.json")
HEART = os.path.join(DIR, "heartbeat")
LOCK = os.path.join(DIR, "watch.lock")
QUOTA_FLAG = os.path.join(DIR, "quota_pause.flag")
PROGRESS = os.path.join(PROJ, "scripts/v20-map-progress.json")
SESS = os.path.expanduser("~/.codex/sessions")

STALL_MIN = 60
GAP_MIN = 30
QUOTA_MAX = 80.0
FAIL_MAX = 3
RESTART_LIMIT = 3
RESTART_WINDOW_S = 6 * 3600
CPU_BUSY_PCT = 3.0
EXCERPT_LINES = 20

# TASK24 地圖視覺；不得降低 validate 門檻。目標完成後不要再啟動 writer。
# 不要碰 /workspace/mission-control。

SENSITIVE_RE = re.compile(
    r"(?i)(\b(otp|2fa|mfa)\b|"
    r"one[ -]?time (code|password|passcode)|"
    r"verification code|"
    r"please (log|sign) in|"
    r"sign[ -]?in (to continue|required)|"
    r"payment (required|failed|method)|"
    r"credit card|"
    r"驗證碼|一次性密碼|付款提示)"
)


def now_str(ts=None):
    return datetime.fromtimestamp(ts or time.time()).strftime("%Y-%m-%d %H:%M:%S")


def log(msg, log_path=None):
    line = f"[{now_str()}] {msg}"
    path = log_path or LOG
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a") as f:
        f.write(line + "\n")
    print(line)


def atomic_write(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def acquire_lock(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o644)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(fd)
        return None
    try:
        os.ftruncate(fd, 0)
        os.write(fd, str(os.getpid()).encode())
    except OSError:
        pass
    return fd


def boot_id():
    try:
        return open("/proc/sys/kernel/random/boot_id").read().strip()
    except OSError:
        return ""


def proc_cpu_time(pid):
    try:
        data = open(f"/proc/{pid}/stat").read()
    except OSError:
        return 0.0
    rparen = data.rfind(")")
    fields = data[rparen + 2 :].split()
    if len(fields) < 13:
        return 0.0
    ticks = os.sysconf("SC_CLK_TCK") or 100
    return (int(fields[11]) + int(fields[12])) / float(ticks)


def pids_alive(pids):
    alive = []
    for pid in pids:
        try:
            os.kill(pid, 0)
            alive.append(pid)
        except (OSError, ProcessLookupError, ValueError):
            continue
    return alive


def codex_pids(proj=None):
    proj = proj or PROJ
    out = subprocess.run(
        ["pgrep", "-f", f"codex exec .*-C {proj}"],
        capture_output=True, text=True,
    )
    if out.returncode not in (0, 1):
        raise RuntimeError("pgrep failed")
    me = os.getpid()
    pids = []
    for p in out.stdout.split():
        try:
            pid = int(p)
        except ValueError:
            continue
        if pid != me:
            pids.append(pid)
    return pids


def logs(proj=None, prefix=None):
    """Prefer current task prefix (codex24*). Never fall back to older TASK22/23 logs."""
    proj = proj or PROJ
    prefix = prefix or LOG_PREFIX
    fs = [
        f for f in glob.glob(os.path.join(proj, f"{prefix}*.log"))
        if re.fullmatch(rf"{re.escape(prefix)}[a-z]*\.log", os.path.basename(f))
    ]
    return sorted(fs, key=os.path.getmtime)


def next_log(fs, prefix=None, proj=None):
    """codex24 -> codex24b; ...z -> ...za; if none yet, codex24.log."""
    prefix = prefix or LOG_PREFIX
    d = proj or PROJ
    existing = {os.path.basename(f) for f in glob.glob(os.path.join(d, f"{prefix}*.log"))}
    if not fs:
        name = f"{prefix}.log"
        if name not in existing:
            return os.path.join(d, name)
        fs = [os.path.join(d, name)]
    newest = fs[-1]
    m = re.fullmatch(rf"({re.escape(prefix)})([a-z]*)\.log", os.path.basename(newest))
    if not m:
        return os.path.join(d, f"{prefix}.log")
    base, suf = m.group(1), m.group(2)
    for _ in range(200):
        if not suf:
            suf = "b"
        elif suf[-1] == "z":
            suf = suf + "a"
        else:
            suf = suf[:-1] + chr(ord(suf[-1]) + 1)
        name = f"{base}{suf}.log"
        if name not in existing:
            return os.path.join(d, name)
    raise RuntimeError("could not find free log name")


def task_from_args(args, proj=None):
    proj = proj or PROJ
    joined = " ".join(args)
    m = re.search(r"(TASK[\w-]*\.md)", joined)
    if m and os.path.exists(os.path.join(proj, m.group(1))):
        return m.group(1)
    prompt = args[-1].strip() if args else ""
    best = None
    for f in glob.glob(os.path.join(proj, "TASK*.md")):
        try:
            c = open(f, errors="ignore").read().strip()
        except OSError:
            continue
        if c and (prompt == c or (len(prompt) >= 40 and c.startswith(prompt[:200]))):
            if best is None or len(c) > best[0]:
                best = (len(c), os.path.basename(f))
    return best[1] if best else None


def running_task(pids, proj=None):
    for pid in pids:
        try:
            args = open(f"/proc/{pid}/cmdline", "rb").read().decode(errors="ignore").split("\0")
        except OSError:
            continue
        args = [a for a in args if a]
        t = task_from_args(args, proj=proj)
        if t:
            return t
    return None


def quotas(sess=None):
    sess = sess or SESS
    fs = sorted(glob.glob(os.path.join(sess, "*/*/*/rollout-*.jsonl")), key=os.path.getmtime)
    for f in reversed(fs[-5:]):
        with open(f, errors="ignore") as h:
            txt = h.read()
        m = list(re.finditer(
            r'"primary":\{"used_percent":([\d.]+).*?"secondary":\{"used_percent":([\d.]+)',
            txt,
        ))
        if m:
            return float(m[-1].group(1)), float(m[-1].group(2))
    raise RuntimeError("no rate_limits in recent rollout files")


def target_complete(s):
    status = (s.get("status") or "").lower()
    if status in ("complete", "done", "completed"):
        return True
    if s.get("completed") is not None and s.get("target") is not None and s["completed"] >= s["target"]:
        return True
    return False


def excerpt(path, n=EXCERPT_LINES, start_at=0):
    if not path or not os.path.exists(path):
        return ""
    try:
        with open(path, errors="ignore") as f:
            if start_at:
                f.seek(start_at)
            text = f.read()
    except OSError:
        return ""
    lines = text.splitlines()
    tail = lines[-80:] if len(lines) > 80 else lines
    err = [ln for ln in tail if re.search(r"error|exception|fail|quota|stall|killed", ln, re.I)]
    pick = err[-n:] if err else tail[-n:]
    return "\n".join(pick)[:4000]


def scan_sensitive(text):
    if not text:
        return False
    return bool(SENSITIVE_RE.search(text))


def default_state():
    return {
        "last_success_check": None,
        "last_success_ts": None,
        "consecutive_failures": 0,
        "task": TASK,
        "boot_id": None,
        "codex": {},
        "progress": {},
        "quota": {},
        "stall_idle_accum_min": 0.0,
        "prev_cpu_time": None,
        "prev_log_size": None,
        "prev_log_mtime": None,
        "prev_progress_mtime": None,
        "restart_times": [],
        "restart_blocked": False,
        "quota_paused": False,
        "unhandled_events": [],
        "last_wake_event": None,
        "last_clock_gap": None,
        "consecutive_failures": 0,
    }


def load_state(path):
    st = default_state()
    if os.path.exists(path):
        try:
            old = json.load(open(path))
            if isinstance(old, dict):
                st.update(old)
        except (OSError, json.JSONDecodeError):
            pass
    st.setdefault("unhandled_events", [])
    st.setdefault("restart_times", [])
    st.setdefault("stall_idle_accum_min", 0.0)
    return st


def event_by_type(events, typ):
    for ev in events:
        if ev.get("type") == typ and ev.get("status", "open") == "open":
            return ev
    return None


def upsert_event(events, typ, summary, ts, state_key=None):
    """Increment count for an ongoing event, or open a new one.

    Returns (event, is_new_or_changed).
    """
    ev = event_by_type(events, typ)
    if ev:
        changed = False
        ev["count"] = ev.get("count", 1) + 1
        ev["last_seen"] = now_str(ts)
        if state_key is not None and ev.get("state_key") != state_key:
            ev["state_key"] = state_key
            ev["summary"] = summary
            changed = True
        # count-only update of the same anomaly is not a state change
        return ev, changed
    ev = {
        "id": f"{typ}-{int(ts)}",
        "type": typ,
        "first_seen": now_str(ts),
        "last_seen": now_str(ts),
        "count": 1,
        "summary": summary,
        "status": "open",
        "state_key": state_key,
    }
    events.append(ev)
    return ev, True


def resolve_event(events, typ, ts):
    ev = event_by_type(events, typ)
    if ev:
        ev["status"] = "resolved"
        ev["resolved_at"] = now_str(ts)
        return ev
    return None


def collect(cfg):
    prog_path = cfg["progress"]
    with open(prog_path) as f:
        p = json.load(f)
    t = p.get("task24") or p.get("task23") or p.get("task22") or p.get("task21", {})
    default_target = 9 if "task24" in p else (8 if "task23" in p else (500 if "task22" in p else 1500))
    fs = logs(cfg["proj"], cfg["log_prefix"])
    if fs:
        lf = fs[-1]
    else:
        lf = os.path.join(cfg["proj"], f"{cfg['log_prefix']}.log")
    if os.path.exists(lf):
        stt = os.stat(lf)
        log_size, log_mtime = stt.st_size, stt.st_mtime
        log_name = os.path.basename(lf)
        log_path = lf
    else:
        log_size, log_mtime, log_name, log_path = 0, 0.0, os.path.basename(lf), lf

    if cfg.get("fake_quota") is not None:
        q5, qw = cfg["fake_quota"]
    else:
        q5, qw = quotas()

    if cfg.get("fake_pids") is not None:
        pids = list(cfg["fake_pids"])
        pids = pids_alive(pids)
        task = cfg.get("fake_task") or (TASK if pids else None)
    else:
        pids = codex_pids(cfg["proj"])
        task = running_task(pids, proj=cfg["proj"])

    if cfg.get("fake_cpu_time") is not None:
        cpu_time = cfg["fake_cpu_time"]
    elif pids:
        cpu_time = sum(proc_cpu_time(pid) for pid in pids)
    else:
        cpu_time = 0.0

    prog_mtime = os.path.getmtime(prog_path) if os.path.exists(prog_path) else 0.0
    prev_size = cfg.get("prev_log_size") or 0
    excerpt_text = excerpt(log_path, start_at=prev_size if prev_size < log_size else 0)
    new_bytes = ""
    if log_path and os.path.exists(log_path) and log_size > prev_size:
        try:
            with open(log_path, errors="ignore") as f:
                f.seek(prev_size)
                new_bytes = f.read()
        except OSError:
            new_bytes = excerpt_text

    return {
        "pids": pids,
        "alive": bool(pids),
        "task": task,
        "log": log_name,
        "log_path": log_path,
        "log_size": log_size,
        "log_mtime": log_mtime,
        "log_age_min": round((cfg["now"] - log_mtime) / 60, 1) if log_mtime else 0.0,
        "progress_mtime": prog_mtime,
        "cpu_time": cpu_time,
        "completed": t.get("completed"),
        "target": t.get("target", default_target),
        "status": t.get("status", p.get("status")),
        "q5": q5,
        "qw": qw,
        "_logs": fs,
        "_new_log": new_bytes,
        "_excerpt": excerpt_text,
        "_boot_id": boot_id(),
    }


def compute_cpu_pct(snap, st, elapsed, clock_gap):
    if snap.get("fake_cpu_pct") is not None:
        return snap["fake_cpu_pct"]
    prev = st.get("prev_cpu_time")
    if clock_gap or prev is None or elapsed <= 0:
        return None
    return max(0.0, (snap["cpu_time"] - prev) / elapsed * 100.0)


def decide(snap, st, cfg):
    """Pure decision. Returns a result dict; does not write files or restart."""
    now = cfg["now"]
    stall_min = cfg["stall_min"]
    gap_min = cfg["gap_min"]
    reasons = []
    events_to_wake = []  # list of (event, notify)
    should_restart = False
    clock_gap = False
    gap_sec = None
    last_ts = st.get("last_success_ts")
    if last_ts:
        gap_sec = now - float(last_ts)
        if gap_sec > gap_min * 60:
            clock_gap = True
    prev_boot = st.get("boot_id")
    if prev_boot and snap.get("_boot_id") and prev_boot != snap["_boot_id"]:
        clock_gap = True
        reasons.append("clock-gap: reboot detected")

    if clock_gap and gap_sec is not None:
        st["last_clock_gap"] = {
            "time": now_str(now),
            "gap_min": round(gap_sec / 60, 1),
            "boot_changed": bool(prev_boot and snap.get("_boot_id") and prev_boot != snap["_boot_id"]),
        }
        reasons.append(f"clock-gap: {round(gap_sec/60, 1)}min since last check (no false stall)")

    elapsed = gap_sec if gap_sec is not None and not clock_gap else 0.0
    cpu_pct = snap.get("fake_cpu_pct")
    if cpu_pct is None:
        cpu_pct = compute_cpu_pct(snap, st, elapsed, clock_gap)
    snap["cpu_pct"] = None if cpu_pct is None else round(cpu_pct, 2)

    sensitive = scan_sensitive(snap.get("_new_log") or "")
    complete = target_complete(snap)
    quota_hit = max(snap["q5"], snap["qw"]) >= cfg["quota_max"]
    previously_paused = bool(st.get("quota_paused") or os.path.exists(cfg["quota_flag"]))

    # activity since last check (not raw log age)
    log_unchanged = (
        st.get("prev_log_size") is not None
        and snap["log_size"] == st.get("prev_log_size")
        and snap["log_mtime"] <= (st.get("prev_log_mtime") or 0)
    )
    progress_unchanged = (
        st.get("prev_progress_mtime") is not None
        and snap["progress_mtime"] <= (st.get("prev_progress_mtime") or 0)
    )
    cpu_idle = (cpu_pct is not None) and (cpu_pct < cfg["cpu_busy_pct"])
    if clock_gap or not snap["pids"]:
        st["stall_idle_accum_min"] = 0.0
    elif log_unchanged and progress_unchanged and cpu_idle:
        st["stall_idle_accum_min"] = float(st.get("stall_idle_accum_min") or 0) + elapsed / 60.0
    elif log_unchanged and progress_unchanged and cpu_pct is None:
        # first sample after start/gap: do not accumulate
        pass
    else:
        st["stall_idle_accum_min"] = 0.0

    stalled = bool(snap["pids"]) and st["stall_idle_accum_min"] >= stall_min

    if sensitive:
        summary = "偵測到登入／OTP／付款提示，已停止自動重啟，需要決定。"
        ev, new = upsert_event(st["unhandled_events"], "stuck", summary, now, state_key="sensitive")
        if new:
            ev["summary"] = summary
            events_to_wake.append((ev, True))
        reasons.append("stuck: sensitive prompt")
    if quota_hit:
        summary = f"配額達門檻 5h={snap['q5']}% wk={snap['qw']}%（>={cfg['quota_max']}%），已暫停。"
        ev, new = upsert_event(st["unhandled_events"], "quota_pause", summary, now,
                               state_key="paused")
        # only wake on entering pause, not on every later check
        if not previously_paused:
            ev["summary"] = summary
            ev["count"] = 1
            events_to_wake.append((ev, True))
        elif new:
            events_to_wake.append((ev, True))
        st["quota_paused"] = True
        reasons.append(f"quota_pause: 5h={snap['q5']}% wk={snap['qw']}%")
    elif previously_paused:
        resolve_event(st["unhandled_events"], "quota_pause", now)
        st["quota_paused"] = False
        summary = f"配額已回落到 5h={snap['q5']}% wk={snap['qw']}%，恢復巡檢。"
        ev, new = upsert_event(st["unhandled_events"], "quota_resumed", summary, now,
                               state_key=f"{snap['q5']}/{snap['qw']}")
        if new:
            events_to_wake.append((ev, True))
        reasons.append("quota_resumed")

    if not snap["pids"] and complete:
        summary = f"任務完成 {snap['completed']}/{snap['target']}（{snap['status']}），Codex 已結束。"
        ev, new = upsert_event(st["unhandled_events"], "finished", summary, now,
                               state_key=f"{snap['completed']}/{snap['target']}/{snap['status']}")
        if new:
            events_to_wake.append((ev, True))
        reasons.append("finished")
        resolve_event(st["unhandled_events"], "stuck", now)
    elif not snap["pids"] and not complete and not sensitive and not quota_hit:
        # crash / unexpected exit
        restart_times = [t for t in st.get("restart_times") or [] if now - t < cfg["restart_window"]]
        st["restart_times"] = restart_times
        if st.get("restart_blocked") or len(restart_times) >= cfg["restart_limit"]:
            st["restart_blocked"] = True
            summary = f"6 小時內已自動重啟 {len(restart_times)} 次，已停止重啟，需要決定。"
            ev, new = upsert_event(st["unhandled_events"], "stuck", summary, now,
                                   state_key=f"restart-limit-{len(restart_times)}")
            if new:
                events_to_wake.append((ev, True))
            reasons.append("stuck: restart limit")
        else:
            # crashed_restarted 事件在成功重啟後由 run() 記錄，避免同一狀態重複累加。
            should_restart = bool(cfg.get("auto_restart"))
            reasons.append("crashed_restarted")
            if not cfg.get("auto_restart"):
                summary = f"Codex 行程消失（進度 {snap['completed']}/{snap['target']}），未啟用自動重啟。"
                ev, new_ev = upsert_event(st["unhandled_events"], "stuck", summary, now,
                                          state_key="exited")
                if new_ev:
                    events_to_wake.append((ev, True))
    elif stalled and not sensitive:
        summary = (
            f"Codex 疑似卡住：觀察閒置 {st['stall_idle_accum_min']:.0f} 分鐘，"
            f"log/進度無更新且 CPU={snap['cpu_pct']}%。"
        )
        ev, new = upsert_event(st["unhandled_events"], "stuck", summary, now, state_key="stall")
        if new:
            events_to_wake.append((ev, True))
        reasons.append(f"stuck: stalled accum={st['stall_idle_accum_min']:.1f}min cpu={snap['cpu_pct']}")
    elif snap["pids"] and not stalled:
        # recovered from stall/crash if those were open
        if event_by_type(st["unhandled_events"], "stuck") and event_by_type(st["unhandled_events"], "stuck").get("state_key") == "stall":
            resolve_event(st["unhandled_events"], "stuck", now)
        if event_by_type(st["unhandled_events"], "crashed_restarted"):
            resolve_event(st["unhandled_events"], "crashed_restarted", now)

    # never restart when complete, quota, sensitive, blocked, or process exists
    if complete or quota_hit or sensitive or st.get("restart_blocked") or snap["pids"]:
        should_restart = False

    # No "still running" event
    return {
        "reasons": reasons,
        "events_to_wake": events_to_wake,
        "should_restart": should_restart,
        "clock_gap": clock_gap,
        "cpu_pct": snap.get("cpu_pct"),
        "sensitive": sensitive,
        "quota_hit": quota_hit,
        "complete": complete,
        "stalled": stalled,
    }


def launch_cmd(cfg, log_path, task):
    if cfg.get("restart_cmd"):
        return cfg["restart_cmd"]
    return (
        f'cd {cfg["proj"]} && nohup codex exec -s workspace-write '
        f'-c sandbox_workspace_write.network_access=true -c model_reasoning_effort=medium '
        f'--skip-git-repo-check -C {cfg["proj"]} "$(cat {task})" > {os.path.basename(log_path)} 2>&1 &'
    )


def restart(snap, cfg, task):
    if snap["pids"]:
        return "skip: process exists"
    if max(snap["q5"], snap["qw"]) >= cfg["quota_max"]:
        return "skip: quota>=80"
    if target_complete(snap):
        return "skip: target complete"
    task = task or TASK
    if os.path.basename(task) != os.path.basename(cfg["task"]):
        log(f"forcing task {task} -> {cfg['task']}", cfg["log"])
        task = cfg["task"]
    if not os.path.isabs(task):
        task_path = os.path.join(cfg["proj"], task)
    else:
        task_path = task
    nl = next_log(snap.get("_logs") or [], prefix=cfg["log_prefix"], proj=cfg["proj"])
    cmd = launch_cmd(cfg, nl, task_path)
    if cfg["dry"]:
        log(f"DRY would restart: {cmd}", cfg["log"])
        return "dry"
    # Re-check no writer exists immediately before spawn
    if not cfg.get("restart_cmd") and codex_pids(cfg["proj"]):
        return "skip: process exists"
    subprocess.Popen(["bash", "-lc", cmd], start_new_session=True)
    time.sleep(2 if cfg.get("restart_cmd") else 20)
    if cfg.get("restart_cmd"):
        ok = True
    else:
        ok = bool(codex_pids(cfg["proj"])) and os.path.exists(nl) and os.path.getsize(nl) > 0
    log(f"restart {'OK' if ok else 'FAILED'} -> {nl}", cfg["log"])
    return "ok" if ok else "failed"


def build_wake(ev, notify, snap, st):
    excerpt_text = snap.get("_excerpt") or ""
    lines = excerpt_text.splitlines()[:EXCERPT_LINES]
    return {
        "time": ev.get("last_seen") or now_str(),
        "event": ev["type"],
        "summary": ev.get("summary") or ev["type"],
        "progress": f"{snap.get('completed')}/{snap.get('target')} {snap.get('status')}",
        "quota": {"q5": snap.get("q5"), "qw": snap.get("qw")},
        "excerpt": "\n".join(lines),
        "notify": bool(notify),
        "id": ev.get("id"),
        "count": ev.get("count", 1),
    }


def persist_snapshot(st, snap, cfg, mode, decision):
    st["last_success_check"] = now_str(cfg["now"])
    st["last_success_ts"] = cfg["now"]
    st["task"] = os.path.basename(cfg["task"])
    st["boot_id"] = snap.get("_boot_id") or st.get("boot_id")
    st["codex"] = {
        "pids": snap["pids"],
        "alive": snap["alive"],
        "cpu_pct": snap.get("cpu_pct"),
        "cpu_time": snap.get("cpu_time"),
        "log": snap.get("log"),
        "log_size": snap.get("log_size"),
        "log_mtime": now_str(snap["log_mtime"]) if snap.get("log_mtime") else None,
        "log_age_min": snap.get("log_age_min"),
    }
    st["progress"] = {
        "completed": snap.get("completed"),
        "target": snap.get("target"),
        "status": snap.get("status"),
    }
    st["quota"] = {"q5": snap["q5"], "qw": snap["qw"]}
    st["prev_cpu_time"] = snap.get("cpu_time")
    st["prev_log_size"] = snap.get("log_size")
    st["prev_log_mtime"] = snap.get("log_mtime")
    st["prev_progress_mtime"] = snap.get("progress_mtime")
    st["consecutive_failures"] = 0
    # keep last observation for compatibility with older readers
    st["last"] = {k: v for k, v in snap.items() if not k.startswith("_")}
    atomic_write(cfg["state"], json.dumps(st, ensure_ascii=False, indent=1) + "\n")
    atomic_write(cfg["heart"], now_str(cfg["now"]) + f" {mode}\n")
    if decision["quota_hit"]:
        atomic_write(cfg["quota_flag"], now_str(cfg["now"]) + f" 5h={snap['q5']} wk={snap['qw']}\n")
    elif os.path.exists(cfg["quota_flag"]):
        try:
            os.remove(cfg["quota_flag"])
        except OSError:
            pass


def parse_args(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", dest="dry", action="store_true", default=True)
    ap.add_argument("--live", dest="dry", action="store_false")
    ap.add_argument("--auto-restart", action="store_true")
    ap.add_argument("--state-dir", default=DIR)
    ap.add_argument("--proj", default=PROJ)
    ap.add_argument("--task", default=TASK)
    ap.add_argument("--progress", default=None)
    ap.add_argument("--log-prefix", default=LOG_PREFIX)
    ap.add_argument("--stall-min", type=float, default=STALL_MIN)
    ap.add_argument("--gap-min", type=float, default=GAP_MIN)
    ap.add_argument("--fake-pids", default=None,
                    help="Comma-separated pids to inspect instead of pgrep; empty means no process.")
    ap.add_argument("--fake-cpu-pct", type=float, default=None)
    ap.add_argument("--fake-cpu-time", type=float, default=None)
    ap.add_argument("--fake-quota", default=None, help="e.g. 18,66")
    ap.add_argument("--fake-now", type=float, default=None)
    ap.add_argument("--restart-cmd", default=None,
                    help="Override Codex launch (tests only). Never used in production.")
    ap.add_argument("--no-lock", action="store_true")
    return ap.parse_args(argv)


def cfg_from_args(a):
    state_dir = os.path.expanduser(a.state_dir)
    os.makedirs(state_dir, exist_ok=True)
    fake_pids = None
    if a.fake_pids is not None:
        fake_pids = [int(x) for x in a.fake_pids.split(",") if x.strip()]
    fake_quota = None
    if a.fake_quota:
        parts = a.fake_quota.split(",")
        fake_quota = (float(parts[0]), float(parts[1]))
    now = a.fake_now if a.fake_now is not None else time.time()
    return {
        "dry": a.dry,
        "auto_restart": a.auto_restart,
        "state_dir": state_dir,
        "state": os.path.join(state_dir, "state.json"),
        "log": os.path.join(state_dir, "watch.log"),
        "wake": os.path.join(state_dir, "wake.json"),
        "heart": os.path.join(state_dir, "heartbeat"),
        "lock": os.path.join(state_dir, "watch.lock"),
        "quota_flag": os.path.join(state_dir, "quota_pause.flag"),
        "proj": a.proj,
        "task": a.task,
        "progress": a.progress or os.path.join(a.proj, "scripts/v20-map-progress.json"),
        "log_prefix": a.log_prefix,
        "stall_min": a.stall_min,
        "gap_min": a.gap_min,
        "quota_max": QUOTA_MAX,
        "restart_limit": RESTART_LIMIT,
        "restart_window": RESTART_WINDOW_S,
        "cpu_busy_pct": CPU_BUSY_PCT,
        "fake_pids": fake_pids,
        "fake_cpu_pct": a.fake_cpu_pct,
        "fake_cpu_time": a.fake_cpu_time,
        "fake_quota": fake_quota,
        "now": now,
        "restart_cmd": a.restart_cmd,
        "no_lock": a.no_lock,
    }


def main(argv=None):
    a = parse_args(argv)
    cfg = cfg_from_args(a)
    # bind module-level log path used by helpers
    global LOG
    LOG = cfg["log"]

    lockfd = None
    if not cfg["no_lock"]:
        lockfd = acquire_lock(cfg["lock"])
        if lockfd is None:
            log(f"another watcher holds {cfg['lock']}, exit")
            return 0

    try:
        return run(cfg)
    finally:
        if lockfd is not None:
            try:
                fcntl.flock(lockfd, fcntl.LOCK_UN)
            except OSError:
                pass
            os.close(lockfd)


def run(cfg):
    st = load_state(cfg["state"])
    mode = "DRY" if cfg["dry"] else "LIVE"
    cfg["prev_log_size"] = st.get("prev_log_size") or 0
    try:
        snap = collect(cfg)
        if cfg.get("fake_cpu_pct") is not None:
            snap["fake_cpu_pct"] = cfg["fake_cpu_pct"]
    except Exception as e:
        st["consecutive_failures"] = st.get("consecutive_failures", 0) + 1
        log(f"{mode} check failed ({st['consecutive_failures']}/{FAIL_MAX}): {e}", cfg["log"])
        atomic_write(cfg["state"], json.dumps(st, ensure_ascii=False, indent=1) + "\n")
        if st["consecutive_failures"] >= FAIL_MAX:
            ev, new = upsert_event(
                st["unhandled_events"], "stuck",
                f"連續 {FAIL_MAX} 次檢查失敗：{e}", cfg["now"],
                state_key="check-failed",
            )
            if new and not cfg["dry"]:
                wake = build_wake(ev, True, {
                    "completed": None, "target": None, "status": None,
                    "q5": None, "qw": None, "_excerpt": str(e),
                }, st)
                atomic_write(cfg["wake"], json.dumps(wake, ensure_ascii=False, indent=1) + "\n")
                st["last_wake_event"] = ev["id"]
                atomic_write(cfg["state"], json.dumps(st, ensure_ascii=False, indent=1) + "\n")
                log(f"{mode} wrote wake.json: stuck (check failed)", cfg["log"])
        return 1

    decision = decide(snap, st, cfg)

    if decision["should_restart"] and cfg["auto_restart"]:
        r = restart(snap, cfg, cfg["task"])
        if r == "ok":
            st["restart_times"] = [t for t in st.get("restart_times") or [] if cfg["now"] - t < cfg["restart_window"]]
            st["restart_times"].append(cfg["now"])
            log(f"{mode} auto-restart recorded ({len(st['restart_times'])}/{cfg['restart_limit']} in 6h)", cfg["log"])
            summary = (
                f"Codex 行程消失後已自動重啟（進度 {snap['completed']}/{snap['target']}），"
                f"6h 內第 {len(st['restart_times'])} 次。"
            )
            ev, _changed = upsert_event(
                st["unhandled_events"], "crashed_restarted", summary, cfg["now"],
                state_key="crash",
            )
            ev["summary"] = summary
            notify = ev["count"] >= 2
            decision["events_to_wake"].append((ev, notify))
        elif r == "failed":
            ev, new_ev = upsert_event(
                st["unhandled_events"], "stuck",
                "自動重啟失敗，需要決定。", cfg["now"], state_key="restart-failed",
            )
            if new_ev:
                decision["events_to_wake"].append((ev, True))
        elif r == "dry":
            log(f"{mode} dry-run, not recording a restart", cfg["log"])
        elif r.startswith("skip:"):
            log(f"{mode} {r}", cfg["log"])
            decision["should_restart"] = False

    log(
        f"{mode} pids={snap['pids']} log={snap['log']} age={snap['log_age_min']}m "
        f"cpu={snap.get('cpu_pct')} stall_accum={st.get('stall_idle_accum_min', 0):.1f}m "
        f"completed={snap['completed']}/{snap['target']} task={snap.get('task') or st.get('task')} "
        f"status={snap['status']} quota5h={snap['q5']} wk={snap['qw']} "
        f"gap={'yes' if decision['clock_gap'] else 'no'} reasons={decision['reasons'] or 'none'}",
        cfg["log"],
    )

    if decision["events_to_wake"]:
        ev, notify = decision["events_to_wake"][-1]
        if cfg["dry"]:
            log(f"DRY would wake Mia: {ev['type']} notify={notify} {ev.get('summary')}", cfg["log"])
        else:
            wake = build_wake(ev, notify, snap, st)
            atomic_write(cfg["wake"], json.dumps(wake, ensure_ascii=False, indent=1) + "\n")
            st["last_wake_event"] = ev["id"]
            log(f"LIVE wrote wake.json: {ev['type']} notify={notify} {ev.get('summary')}", cfg["log"])
    else:
        log(f"{mode} no new wake (deduped or quiet)", cfg["log"])

    persist_snapshot(st, snap, cfg, mode, decision)
    return 0


if __name__ == "__main__":
    sys.exit(main())
