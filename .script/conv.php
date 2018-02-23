<?php

$ext = ".txt";
do_dir(".");

function do_dir($dir)
{
  global $ext;
  $d = dir($dir);
  echo "Path: " . $d->path . "\n";
  while (false !== ($entry = $d->read())) {
    echo $entry."\n";
    if ($entry[0] === ".") continue;
    $f = "$dir/$entry";
    if (is_dir($f)) do_dir($f);
    if (is_file($f) && endsWith($f, $ext)) {
      $content = file_get_contents($f);
      $content_utf8 = iconv("GBK", "UTF-8", $content);
      $md_content = preg_replace('/\n/', "\n\n", $content_utf8);
      $title_raw = get_first_line($md_content);
      $title = trim($title_raw);
      $md_content = "---\nlayout: chapter\ntitle: $title\n---\n\n#".$md_content;
      $md_file = substr($f,0,strlen($f)-4).".md";
      echo "iconv $f => $md_file\n";
      file_put_contents($md_file, $md_content);
      unlink($f);
    }
  }
  $d->close();
}

function get_first_line($content) {
  $pos = strpos($content, "\n"); 
  return substr($content, 0, $pos);
}

function startsWith($haystack, $needle)
{
     $length = strlen($needle);
     return (substr($haystack, 0, $length) === $needle);
}

function endsWith($haystack, $needle)
{
    $length = strlen($needle);

    return $length === 0 || 
    (substr($haystack, -$length) === $needle);
}