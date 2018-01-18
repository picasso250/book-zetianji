<?php

$toc =[
"8865148"=>    "引子",
"8865149"=>    "新年：救贖",
"8898002"=>    "新年：福音——DAY OPEN",
"8898003"=>    "新年：福音——DAY ONE",
"8898015"=>    "新年：福音——DAY FALL",
"8898648"=>    "新年：福音——DAY REST",
"8898731"=>    "新年：福音——DAY SET",
"8865305"=>    "之前的事",
"8898012"=>    "啟明之猩",
"8898013"=>    "魂海守望者",
"8898014"=>    "狐狸與太陽",
"8897990"=>    "引子",
"8897991"=>    "Chapter 0   風暴前夕",
"8897992"=>    "Chapter 1   約櫃",
"8897993"=>    "Chapter 2   第一接觸者",
"8897994"=>    "Chapter 3  九尾狐",
"8897995"=>    "Chapter 4     &#35832;海之白麒麟",
"8897996"=>    "Chapter 5 以鑰匙通過那門",
"8897997"=>    "Chapter 6  善後",
"8897998"=>    "Chapter 7  醒來",
"8897999"=>    "Chapter 8   皇帝",
"8898000"=>    "Chapter9  佛雷卡們",
"8898001"=>    "Chapter 10  我是神眷之人",
];
foreach ($toc as $key => $title) {
  $file = "zh/$key.md";
  echo "$file\n";
  $content = file_get_contents($file);
  $content = "---\nlayout: chapter\ntitle: $title\n---\n\n$content";
  file_put_contents($file, $content);
}