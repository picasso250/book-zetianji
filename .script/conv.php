<?php

$ext = ".txt";
do_dir(".");

function do_dir($dir)
{
  $d = dir($dir);
  echo "Path: " . $d->path . "\n";
  while (false !== ($entry = $d->read())) {
    echo $entry."\n";
    if ($entry[0] === ".") continue;
    $f = "$dir/$entry";
    if (is_dir($f)) do_dir($f);
    if (is_file($f)) {
      $content = file_get_contents($f);
      $md_content = preg_replace('/\n/', "\n\n", $content);
      $md_file = substr($f,0,strlen($f)-4).".md";
      echo "iconv $f => $md_file\n";
      file_put_contents($md_file, iconv("GBK", "UTF-8", $md_content));
    }
  }
  $d->close();
}

