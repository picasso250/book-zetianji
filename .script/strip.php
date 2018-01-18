<?php

// foreach (glob('*[0-9][0-9].html') as $key => $file) {
//   echo $file,PHP_EOL;
//   $html = file_get_contents($file);
// 
//   // print_r(mb_list_encodings());exit;
//   $html_ = mb_convert_encoding($html, "UTF-8", "BIG-5");
// 
//   if (preg_match('/<div id="title">.+/ms', $html_, $m)) {
//     $text = strip_tags($m[0]);
//     if (preg_match('/\d+/', $file, $mm)) {
//       file_put_contents("$mm[0].md", $text);
//     }
//   }
// }
// 
// exit;

foreach (glob('*.utf8.html') as $key => $file) {
  $html = file_get_contents($file);
  if (preg_match('/<div id="title">.+/ms', $html, $m)) {
    $text = strip_tags($m[0]);
    if (preg_match('/\d+/', $file, $mm)) {
      file_put_contents("$mm[0].md", $text);
    }
  }
}
