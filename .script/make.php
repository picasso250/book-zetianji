<?php

for ($i=1; $i <= 23; $i++) { 
  $file = __DIR__."/$i.utf8.html";
  $content = file_get_contents($file);
  if (preg_match('/<title>(.*?)_.*<\/title>/s', $content, $m)) {
    $raw_title = $m[1];
    $toc[$i] = $raw_title;
  }
  if (preg_match('/<pre.+>(.*)<\/pre>/s', $content, $m)) {
    $inner = $m[1];
    $pure_inner = strip_tags($inner);
    $md = preg_replace('/\n/', "\n\n", $pure_inner);
    $file = dirname(__DIR__)."/$i.md";
    echo "$file\n";
    file_put_contents($file, $md);
  }
}
print_r($toc);