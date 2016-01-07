import os
import sys
import csv
import codecs
import errno
# Third party library imports:
import pattern
from pattern.web import URL, DOM
from pattern.web import crawl
# url = URL("http://www.top40.nl/top40/2016/week-1")
# dom = DOM(url.download(cached = True))
    # for link in dom.by_class()
for link, source in crawl('http://www.top40.nl/top40/2016/week-1',["top40.nl"], delay=3, throttle=3):
    if (link != "none"):
        print(link)
