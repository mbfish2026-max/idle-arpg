#!/usr/bin/env python3
"""荒野射手美术：用 tools/gen_image.py（nano-banana-2.1）批量出图，6 路并发；已存在的输出跳过（--force 重做）。
  技能图标 assets/skills/<id>.webp      128 满幅手绘方图（fit）
  技能特效 assets/skills/fx_<id>.webp   256 黑底抠透明（icon）
  召唤物   assets/summon/ama_<id>.webp  256 满幅手绘方图（fit）
  专属武器 assets/icon2/aw1..aw5.webp   128 黑底抠透明（icon）
用法：python3 tools/art2/gen_amazon.py [--force] [--only id1,id2]"""
import os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import gen_image as G

IC = 'square skill icon for a wild huntress archer: {}, full-bleed painted illustration filling the entire square, no frame, no border, edge to edge'
FX = 'magic spell effect sprite: {}, glowing energy only, no characters, no ground'
SM = 'portrait of a summoned ally of a huntress: {}, full-bleed painted scene filling the entire square, dark misty background'
WP = 'weapon item icon: {}'

ICONS = {
 # 弓与弩
 'amag': 'a glowing violet arcane arrow streaking through the dark',
 'afire': 'a flaming arrow trailing orange fire',
 'acold': 'an icy blue frost arrow trailing snowflakes',
 'amul': 'a fan of many arrows released from a drawn bow at once',
 'aexp': 'an arrow striking and bursting into a fiery explosion',
 'aice': 'an arrow of solid ice crystal freezing its target',
 'aguide': 'a single golden arrow curving in flight toward a glowing target mark',
 'astraf': 'a rapid volley of arrows streaking in all directions from a bow',
 'aimm': 'a blazing arrow setting the ground ablaze in a sea of flames',
 'afrz': 'a huge frozen arrow exploding into a burst of ice shards',
 # 标枪与长矛
 'ajab': 'a spear tip thrusting three times with motion blur',
 'apow': 'a spear crackling with blue lightning as it strikes',
 'apoi': 'a javelin dripping green poison leaving toxic fumes',
 'aimp': 'a long spear piercing straight through, blood red impact',
 'albolt': 'a javelin transformed into a jagged lightning bolt',
 'achg': 'a spear tip releasing many small charged lightning orbs',
 'aplag': 'a javelin bursting into a huge cloud of sickly green plague gas',
 'afend': 'a warrior woman spinning her spear striking all around her',
 'alstr': 'a spear raised to the storm sky calling down chain lightning',
 'afury': 'a thrown javelin exploding into many forking lightning bolts',
 # 被动与魔法
 'asight': 'a glowing hunter eye mark floating above enemies',
 'acrit': 'a sharp arrowhead hitting a glowing red weak point',
 'adodge': 'a nimble huntress sidestepping a sword blow, motion trail',
 'aslow': 'arrows slowing to a halt inside a shimmering web of magic',
 'aavoid': 'a huntress twisting away from incoming arrows with leaves swirling',
 'apen': 'a keen eye looking down an arrow shaft aiming',
 'adecoy': 'a ghostly translucent duplicate of a huntress archer',
 'aevade': 'a shadowy blur of a running huntress leaving afterimages',
 'avalk': 'a radiant spectral valkyrie warrior maiden with spear and winged helm',
 'apier': 'an arrow piercing through several shields in a row',
}
FXS = {
 'amag': 'a violet glowing arcane arrow streak with sparkles', 'afire': 'a flaming arrow streak with orange fire trail',
 'acold': 'an icy blue arrow streak with frost particles', 'amul': 'a fan spread of several white glowing arrow streaks',
 'aexp': 'a fiery orange explosion burst', 'aice': 'a cluster of blue ice crystals bursting',
 'aguide': 'a golden glowing arrow streak with a curving light trail', 'astraf': 'many thin white arrow streaks flying outward',
 'aimm': 'a large blazing fire explosion with flames', 'afrz': 'a big icy blue frost explosion with shards',
 'ajab': 'three white thrust streak lines', 'apow': 'a blue lightning burst spark',
 'apoi': 'a green toxic poison gas cloud', 'aimp': 'a sharp red piercing impact burst',
 'albolt': 'a jagged bright lightning bolt', 'achg': 'several small glowing blue lightning orbs crackling',
 'aplag': 'a large swirling sickly green plague cloud', 'afend': 'a circular white spear slash arc',
 'alstr': 'a vertical lightning strike from above with sparks', 'afury': 'a starburst of many forking lightning bolts',
 'asight': 'a glowing golden eye sigil', 'aslow': 'a shimmering purple magic web field',
}
SUMMONS = {
 'adecoy': 'a ghostly translucent blue duplicate of a huntress archer holding a bow',
 'avalk': 'a radiant spectral valkyrie warrior maiden in silver armor with a spear and winged helm, glowing blue aura',
}
WEAPONS = {
 'aw1': 'a short hunting bow made of carved deer antler with leather grip',
 'aw2': 'a slender maiden javelin with a leaf shaped steel tip and feathers',
 'aw3': 'a pale ashwood longbow with glowing green spirit runes',
 'aw4': 'an ornate ceremonial javelin with gold bands and a crescent moon blade tip',
 'aw5': 'a grand ornate goddess war bow of silver and gold with gemstones',
}


def jobs():
    J = []
    for k, d in ICONS.items():
        J.append({'id': k, 'prompt': IC.format(d), 'out': f'assets/skills/{k}.webp', 'mode': 'fit', 'size': '128x128'})
    for k, d in FXS.items():
        J.append({'id': 'fx_' + k, 'prompt': FX.format(d), 'out': f'assets/skills/fx_{k}.webp', 'mode': 'icon', 'size': '256'})
    for k, d in SUMMONS.items():
        J.append({'id': 'ama_' + k, 'prompt': SM.format(d), 'out': f'assets/summon/ama_{k}.webp', 'mode': 'fit', 'size': '256x256'})
    for k, d in WEAPONS.items():
        J.append({'id': k, 'prompt': WP.format(d), 'out': f'assets/icon2/{k}.webp', 'mode': 'icon', 'size': '128'})
    return J


if __name__ == '__main__':
    force = '--force' in sys.argv
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    todo = [j for j in jobs() if (not only or j['id'] in only) and (force or only or not os.path.exists(os.path.join(G.ROOT, j['out'])))]
    print('待生成 %d 张' % len(todo), flush=True)
    with ThreadPoolExecutor(6) as ex:
        ok = sum(ex.map(lambda j: bool(G.run(j)), todo))
    print('完成 %d/%d' % (ok, len(todo)))
