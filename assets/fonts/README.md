# 滿文與蒙古文子集

來源：Noto Sans Mongolian Regular（https://github.com/notofonts/notofonts.github.io/tree/main/fonts/NotoSansMongolian/full/ttf），授權見 OFL-NotoSansMongolian.txt。

原始字型版本：`Version 3.103;fontc 1.0.0; tilvisan (v0.1.1)`；原始 TTF SHA-256：`fe6ff6095785a9099832d850497b6c9874fc8a77973b67cb201366306f14b754`。

本子集由 scripts/subset-mongolian.py 掃描 data/*.json 的字串建立，保留實際使用的蒙古文字元、空格、FVS、MVS、ZWJ、ZWNJ 與 NNBSP，以及 OpenType 塑形所需的替代字形。未納入其他未使用的文字字元。產物 17,700 位元組。

重建需 Python fontTools 與 Brotli：

```sh
python3 scripts/subset-mongolian.py /path/to/NotoSansMongolian-Regular.ttf
```

CSS 以 unicode-range 與專用元素類別按需載入；正式建置加入 SHA-256 指紋，搭配一年 immutable 快取。
