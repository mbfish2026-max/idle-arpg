# SVG -> 位图渲染（用 Playwright Chromium），供各美术生成脚本使用
import io
from PIL import Image
from playwright.sync_api import sync_playwright
CHROME='/home/box/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
class R:
    def __enter__(self):
        self.p=sync_playwright().start();self.b=self.p.chromium.launch(executable_path=CHROME);self.pg=self.b.new_page();return self
    def __exit__(self,*a):self.b.close();self.p.stop()
    def img(self,svg,w,h,scale=1):
        self.pg.set_viewport_size({'width':w,'height':h})
        self.pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
        png=self.pg.screenshot(omit_background=True,clip={'x':0,'y':0,'width':w,'height':h})
        return Image.open(io.BytesIO(png)).convert('RGBA')
    def save(self,svg,w,h,path,q=86,size=None):
        im=self.img(svg,w,h)
        if size: im=im.resize(size,Image.LANCZOS)
        if path.endswith('.jpg'): im.convert('RGB').save(path,quality=q,optimize=True,progressive=True)
        elif path.endswith('.webp'): im.save(path,'WEBP',quality=q,method=6)
        else: im.save(path,optimize=True)
        return im
