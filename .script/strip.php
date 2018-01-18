<?php


foreach (glob('*.utf8.html') as $key => $file) {
  echo "$file ";
  $html = file_get_contents($file);
  if (preg_match('/<div id="title">.+/ms', $html, $m)) {
    $text = strip_tags($m[0]);
    if (preg_match('/\d+/', $file, $mm)) {
      $text = str_replace("\r\n","\n\n", $text);
      $md_file = "../../zh/$mm[0].md";
      echo "=> $md_file\n";
      file_put_contents($md_file, $text);
    }
  }
}
