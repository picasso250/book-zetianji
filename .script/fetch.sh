for (( i = 1; i <= 23; i++ )); do
  curl "http://www.shushu8.com/zetianji/$i" > $i.html
done