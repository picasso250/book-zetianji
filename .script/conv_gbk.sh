for (( i = 1; i <= 23; i++ )); do
  iconv -f GBK -t "UTF-8" $i.html > $i.utf8.html
done