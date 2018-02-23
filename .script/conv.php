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
    if (is_dir($entry)) do_dir($entry);
    if (is_file($entry)) {
      echo "iconv $entry\n";
      file_put_contents($entry, iconv("GBK", "UTF-8", file_get_contents($entry)));
    }
  }
  $d->close();
}

