if [[ ! -f ezla.html ]]; then
  curl 'http://paradise.ezla.com.tw/files/article/html/238/238387/index.html' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: zh-CN,zh;q=0.9' -H 'Upgrade-Insecure-Requests: 1' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'Cache-Control: max-age=0' --compressed > ezla.html
fi

iconv  -f BIG5 -t "UTF-8" ezla.html > ezla.utf8.html

cat ezla.utf8.html | perl -ne 'print $1,"\t",$2,"\n" if / <a href="(.+?)">(.+?)<\/a>/'

# not run here

for i in 8865148.html 8865149.html 8898002.html 8898003.html 8898015.html 8898648.html 8898731.html 8865305.html 8898012.html 8898013.html 8898014.html 8897990.html 8897991.html 8897992.html 8897993.html 8897994.html 8897995.html 8897996.html 8897997.html 8897998.html 8897999.html 8898000.html 8898001.html ; do
  curl http://paradise.ezla.com.tw/files/article/html/238/238387/$i -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: zh-CN,zh;q=0.9' -H 'Upgrade-Insecure-Requests: 1' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'Cache-Control: max-age=0' --compressed > ezla/$i
  iconv -c -f BIG5 -t "UTF-8" ezla/$i > ezla/$i.utf8.html
done

for i in 8865148.html 8865149.html 8898002.html 8898003.html 8898015.html 8898648.html 8898731.html 8865305.html 8898012.html 8898013.html 8898014.html 8897990.html 8897991.html 8897992.html 8897993.html 8897994.html 8897995.html 8897996.html 8897997.html 8897998.html 8897999.html 8898000.html 8898001.html ; do
  echo $i
  iconv --unicode-subst="?U?" --byte-subst="?" --widechar-subst="?W?" \
    -f "BIG5-HKSCS:2008" -t "UTF-8" ezla/$i > ezla/$i.utf8.html
done

cd ezla
php ../strip.php 
cd ..