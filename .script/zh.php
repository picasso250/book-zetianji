<?php

foreach (glob('zh/*.md') as $key => $file) {
  $content = file_get_contents($file);
  $new_c = transliterator_transliterate('Traditional-Simplified', $content); // 简繁转换
  if (preg_match('/\d+/', $file, $m)) {
    $new_file = "zh_CN/$m[0].md";
    echo "$file => $new_file\n";
    file_put_contents($new_file, $new_c);
  }
}