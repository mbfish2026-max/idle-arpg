#!/usr/bin/env python3
"""圣誓骑士美术：用 tools/gen_image.py（nano-banana-2.1）批量出图，6 路并发；已存在的输出跳过（--force 重做）。
  技能图标 assets/skills/<id>.webp      128 满幅手绘方图（fit）
  技能特效 assets/skills/fx_<id>.webp   256 黑底抠透明（icon），超过 25KB 自动降质量压缩
  专属盾   assets/icon2/ps1..ps5.webp   128 黑底抠透明（icon）
用法：python3 tools/art2/gen_paladin.py [--force] [--only id1,id2]"""
import os, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import gen_image as G

IC = 'square skill icon for a holy paladin knight: {}, full-bleed painted illustration filling the entire square, gold, white and deep crimson palette, no frame, no border, edge to edge'
FX = 'magic spell effect sprite: {}, glowing energy only, no characters, no ground, isolated on pure black background'
SH = 'paladin shield item icon: {}, isolated on pure black background'

ICONS = {
 # 战斗技能
 'psac': 'a glowing longsword striking down with a spray of the knight\'s own blood turning into holy light',
 'psmite': 'a heavy golden kite shield bashing forward with a bright impact flash',
 'pbolt': 'a radiant bolt of white holy light streaking forward through darkness',
 'pzeal': 'a sword making many rapid golden slash arcs in a flurry',
 'pchg': 'an armored knight on a charging warhorse with lance lowered, golden dust',
 'pveng': 'a sword blade wreathed in fire, ice and lightning at once',
 'pham': 'a spinning ethereal golden war hammer spiraling outward with blue-white glow',
 'pconv': 'a glowing hand of light touching the forehead of a kneeling demon, turning it',
 'pshield': 'a kite shield blazing with a radiant golden holy aura and cross emblem',
 'pfist': 'a bolt of lightning striking down from heavenly clouds shaped like a fist',
 # 攻击光环
 'pmight': 'a glowing red aura circle with a clenched gauntlet fist symbol in the center',
 'phfire': 'a ring of holy golden fire flames rising from the ground in a circle',
 'pthorn': 'a glowing aura circle of sharp golden thorns and spikes',
 'paim': 'a radiant all-seeing eye inside a golden sigil circle',
 'pconc': 'a meditating knight silhouette with a focused beam of golden light above the head',
 'phfrz': 'a ring of holy blue frost crystals and freezing mist rising from the ground',
 'phshk': 'a ring of crackling holy lightning arcs rising from the ground',
 'psanc': 'a radiant white chapel sanctuary sigil glowing on the ground, purifying light',
 'pfana': 'a blazing red and gold fanatic war banner with flames',
 'pconvic': 'golden scales of justice glowing with judgement light',
 # 防御光环
 'ppray': 'praying armored hands glowing with soft healing rose light',
 'prfire': 'a protective shimmering red dome shielding against flames',
 'pdefi': 'a stone fortress wall glowing with protective golden runes',
 'prcold': 'a protective shimmering pale blue dome shielding against frost',
 'pclean': 'a cleansing fountain of pure clear water and white light washing away dark green poison',
 'prlite': 'a protective shimmering yellow dome shielding against lightning bolts',
 'pvigor': 'a running knight silhouette surrounded by green swift energy trails',
 'pmedi': 'a serene glowing blue mana orb floating above a lotus of light',
 'predm': 'ghostly souls rising upward into golden light from fallen enemies',
 'psalv': 'a radiant angel wings emblem enclosing a protective rainbow of elemental colors',
}
FXS = {
 'psac': 'a crimson and gold diagonal sword slash with blood red sparks', 'psmite': 'a golden shield-shaped impact burst with shock rings',
 'pbolt': 'a white-gold glowing holy bolt projectile with light trail', 'pzeal': 'many fast golden crisscross slash streaks',
 'pchg': 'a golden horizontal charging impact burst with dust', 'pveng': 'three-colored slash marks of fire orange, ice blue and lightning yellow',
 'pham': 'a translucent blue-white spinning hammer with spiral light trail', 'pconv': 'a soft golden halo burst with rays of light',
 'pshield': 'a glowing golden protective ring with a shield sigil', 'pfist': 'a bright white lightning bolt strike with holy light burst',
 'pmight': 'a pulsing red aura ring with gold glyphs', 'phfire': 'a circle of golden-orange holy flames bursting outward',
 'pthorn': 'a ring of glowing golden thorn spikes radiating outward', 'paim': 'a golden targeting sigil circle with an eye glyph',
 'pconc': 'a golden concentric focus ring with light rays', 'phfrz': 'a circular burst of pale blue holy frost crystals',
 'phshk': 'a circular burst of crackling white-yellow lightning arcs', 'psanc': 'a radiant white-gold sanctuary ring with holy glyphs',
 'pfana': 'a fiery red and gold whirling aura ring', 'pconvic': 'a purple and gold judgement sigil ring',
 'ppray': 'a soft rose-gold healing light ring with sparkles', 'prfire': 'a red translucent protective ring barrier',
 'pdefi': 'a golden runic protective ring barrier', 'prcold': 'a pale blue translucent protective ring barrier',
 'pclean': 'a clear water-blue purifying ring splash with white sparkles', 'prlite': 'a yellow translucent protective ring barrier with small sparks',
 'pvigor': 'a green swirling energy ring with speed streaks', 'pmedi': 'a calm deep blue mana ring with floating motes',
 'predm': 'rising golden soul wisps in a ring', 'psalv': 'a rainbow tri-color red blue yellow protective halo ring',
}
SHIELDS = {
 'ps1': 'a small round targe shield of steel with a simple golden holy emblem',
 'ps2': 'a heraldic shield with a red and white field and a golden lion crest',
 'ps3': 'a tall kite shield painted with a rising sun emblem in gold and orange',
 'ps4': 'an ornate silver shield shaped like folded angel wings with a glowing blue gem',
 'ps5': 'a magnificent golden crown shield with jewels and radiant holy light',
}


def jobs():
    J = []
    for k, d in ICONS.items():
        J.append({'id': k, 'prompt': IC.format(d), 'out': f'assets/skills/{k}.webp', 'mode': 'fit', 'size': '128x128'})
    for k, d in FXS.items():
        J.append({'id': 'fx_' + k, 'prompt': FX.format(d), 'out': f'assets/skills/fx_{k}.webp', 'mode': 'icon', 'size': '256'})
    for k, d in SHIELDS.items():
        J.append({'id': k, 'prompt': SH.format(d), 'out': f'assets/icon2/{k}.webp', 'mode': 'icon', 'size': '128'})
    return J


def shrink(path, limit=25 * 1024):
    """特效图超过 25KB 时逐步降低 webp 颜色/透明通道质量重存，仍超标再缩小到 224/192"""
    src = Image.open(path).convert('RGBA'); src.load()
    for side in (256, 224, 192):
        im = src if side == src.size[0] else src.resize((side, side), Image.LANCZOS)
        for q in (75, 65, 55, 45):
            if os.path.getsize(path) <= limit:
                return
            im.save(path, 'WEBP', quality=q, alpha_quality=q, method=6)


def run(j):
    ok = G.run(j)
    if ok and j['id'].startswith('fx_'):
        shrink(os.path.join(G.ROOT, j['out']))
    return ok


if __name__ == '__main__':
    force = '--force' in sys.argv
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    todo = [j for j in jobs() if (not only or j['id'] in only) and (force or only or not os.path.exists(os.path.join(G.ROOT, j['out'])))]
    print('待生成 %d 张' % len(todo), flush=True)
    with ThreadPoolExecutor(6) as ex:
        ok = sum(ex.map(lambda j: bool(run(j)), todo))
    print('完成 %d/%d' % (ok, len(todo)))
