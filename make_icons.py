#!/usr/bin/env python3
"""Generate PWA icons from assets/logo.png (falls back to a placeholder).
Usage: python3 make_icons.py   (run next to index.html)"""
import os
from PIL import Image, ImageDraw, ImageFont
BG=(243,244,239,255)   # matches --app background
BRAND=(44,95,16,255)
def load_logo():
    p="assets/logo.png"
    if os.path.exists(p):
        return Image.open(p).convert("RGBA"), True
    im=Image.new("RGBA",(512,512),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse((24,24,488,488),fill=BRAND)
    try: f=ImageFont.truetype("DejaVuSans-Bold.ttf",190)
    except: f=ImageFont.load_default()
    d.text((256,256),"P&C",font=f,fill="white",anchor="mm")
    return im, False
def fit(logo,size,pad):
    box=int(size*(1-2*pad)); w,h=logo.size; k=min(box/w,box/h)
    return logo.resize((max(1,int(w*k)),max(1,int(h*k))),Image.LANCZOS)
def make(size,pad,name):
    logo,_=load_logo(); c=Image.new("RGBA",(size,size),BG); l=fit(logo,size,pad)
    c.alpha_composite(l,((size-l.width)//2,(size-l.height)//2))
    c.convert("RGB").save(f"assets/{name}",optimize=True); print("wrote",name)
make(192,0.12,"icon-192.png"); make(512,0.12,"icon-512.png")
make(512,0.22,"icon-maskable-512.png")   # safe zone for adaptive icons
make(180,0.12,"apple-touch-icon.png"); make(32,0.04,"favicon-32.png")
print("source:", "assets/logo.png" if os.path.exists("assets/logo.png") else "PLACEHOLDER (upload assets/logo.png then re-run)")
