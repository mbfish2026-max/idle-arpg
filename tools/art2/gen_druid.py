#!/usr/bin/env python3
"""德鲁伊美术：用 tools/gen_image.py（nano-banana-2.1）批量出图，6 路并发；已存在的输出跳过（--force 重做）。
  技能图标 assets/skills/<id>.webp      128 满幅手绘方图（fit）
  技能特效 assets/skills/fx_<id>.webp   256 黑底抠透明（icon）
  召唤物   assets/summon/dru_<id>.webp  256 满幅手绘方图（fit）
  变身形态 assets/char/dru_wolf.webp / dru_bear.webp  256 黑底抠透明（icon）
  专属头饰 assets/icon2/dp1..dp5.webp   128 黑底抠透明（icon）
用法：python3 tools/art2/gen_druid.py [--force] [--only id1,id2]"""
import os, sys, json
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import gen_image as G

IC = 'square skill icon for a nature druid: {}, full-bleed painted illustration filling the entire square, earthy greens and browns'
FX = 'magic spell effect sprite: {}, glowing energy only, no characters, no ground'
SM = 'portrait of a druid summoned creature: {}, full-bleed painted scene filling the entire square, dark misty forest background'
HL = 'druid helmet item icon: {}'

ICONS = {
 # 自然元素
 'dfs': 'a roaring firestorm of wild flames sweeping across burning grass',
 'dab': 'a freezing arctic wind blast with swirling snow and ice shards',
 'dmb': 'a huge molten boulder of glowing lava rolling forward',
 'dfis': 'the ground splitting open into a fiery fissure with lava erupting',
 'dcyc': 'a protective cyclone of wind and leaves swirling around a hooded figure',
 'dtw': 'several small twisting whirlwinds full of debris',
 'dvol': 'a small volcano erupting from the earth spewing fire and rocks',
 'dtor': 'a massive dark tornado tearing through a forest',
 'darm': 'a rain of burning meteors falling from a red sky',
 'dhur': 'a freezing hurricane storm of ice and wind encircling',
 # 变形
 'dwere': 'a druid transforming into a snarling grey werewolf under the moon',
 'dlyc': 'a glowing wild beast spirit heart with wolf and bear claw marks',
 'dbear': 'a hulking brown werebear roaring, half man half bear',
 'dferal': 'a werewolf in feral rage with blood red eyes slashing',
 'dmaul': 'a giant bear paw smashing down with great force',
 'drab': 'a snarling wolf head with sickly green glowing fangs and toxic green mist',
 'dclaw': 'beast claws wreathed in flames slashing',
 'dhung': 'savage fangs biting with a crimson life-draining aura',
 'dshock': 'a werebear slamming the ground sending a shockwave of rocks',
 'dfury': 'a werewolf unleashing a flurry of rapid claw strikes',
 # 召唤
 'drav': 'a flock of black ravens with glowing eyes diving',
 'dvine': 'a creeping poisonous vine with toxic green flowers',
 'doak': 'a glowing ancient oak tree spirit radiating healing light',
 'dswolf': 'a translucent blue spirit wolf howling',
 'dcvine': 'a twisted carrion vine with dark red pods feeding on remains',
 'dheart': 'a glowing spirit of a wolverine with a red heart of fury',
 'ddire': 'a huge black dire wolf with bared fangs',
 'dsolar': 'a golden sun vine with glowing blossoms radiating mana light in a dark forest, no frame, no border, edge to edge',
 'dbarb': 'a thorny spirit made of barbed brambles and spikes',
 'dgriz': 'an enormous grizzly bear standing on hind legs roaring',
}
FXS = {
 'dfs': 'a wave of orange fire flames spreading outward', 'dab': 'a cone burst of icy blue frost wind with snowflakes',
 'dmb': 'a glowing molten lava rock impact with sparks', 'dfis': 'a fiery crack eruption with lava spurts',
 'dtw': 'small grey whirlwind twisters', 'dvol': 'an explosion of lava and fire rocks bursting upward',
 'dtor': 'a dark grey spinning tornado funnel', 'darm': 'falling burning meteors with fire trails',
 'dhur': 'a circular swirling ring of icy wind and snow', 'dferal': 'three red glowing claw slash marks',
 'dmaul': 'a heavy golden impact burst with shock rings', 'drab': 'green poison bite marks with toxic mist',
 'dclaw': 'flaming orange claw slash marks', 'dhung': 'crimson bite marks with red life energy wisps',
 'dshock': 'an expanding brown ground shockwave ring with rock debris', 'dfury': 'many fast white claw slash streaks',
 'dwere': 'a swirl of grey wolf spirit energy with moonlight', 'dbear': 'a swirl of brown bear spirit energy with golden light',
 'dcyc': 'a protective green swirling ring of wind and leaves',
}
SUMMONS = {
 'drav': 'a large black raven with glowing amber eyes, wings spread', 'dvine': 'a writhing poisonous creeper vine with glowing green toxic flowers',
 'doak': 'a glowing ancient oak sage spirit, a small luminous tree spirit with a face', 'dswolf': 'a ghostly translucent blue spirit wolf',
 'dcvine': 'a twisted dark red carrion vine with fleshy pods', 'dheart': 'a glowing red spectral wolverine spirit',
 'ddire': 'a huge black dire wolf with glowing yellow eyes', 'dsolar': 'a golden glowing solar creeper vine with sun blossoms',
 'dbarb': 'a spiky bramble spirit made of barbed thorns glowing purple', 'dgriz': 'an enormous battle-scarred grizzly bear roaring',
}
FORMS = {
 'dru_wolf': 'full body hand-painted character art of a druid in werewolf form: a tall feral grey werewolf with tribal bone ornaments and antler totem necklace, standing pose, rich saturated colors, strong contrast, dark grey fur, glowing amber eyes, isolated on pure black background',
 'dru_bear': 'full body hand-painted character art of a druid in werebear form: a massive brown werebear with leaf and bark armor pieces and tribal paint, standing pose, rich saturated colors, isolated on pure black background, no white background',
}
HELMS = {
 'dp1': 'a primitive wolf head pelt hood with fur and fangs', 'dp2': 'a feathered hawk headdress with brown and white feathers',
 'dp3': 'an antlered stag helm of bone and leather', 'dp4': 'a fierce bear head pelt helm with green moss and runes',
 'dp5': 'a regal living crown of twisted golden branches, antlers and glowing leaves',
}


def jobs():
    J = []
    for k, d in ICONS.items():
        J.append({'id': k, 'prompt': IC.format(d), 'out': f'assets/skills/{k}.webp', 'mode': 'fit', 'size': '128x128'})
    for k, d in FXS.items():
        J.append({'id': 'fx_' + k, 'prompt': FX.format(d), 'out': f'assets/skills/fx_{k}.webp', 'mode': 'icon', 'size': '256'})
    for k, d in SUMMONS.items():
        J.append({'id': 'dru_' + k, 'prompt': SM.format(d), 'out': f'assets/summon/dru_{k}.webp', 'mode': 'fit', 'size': '256x256'})
    for k, d in FORMS.items():
        J.append({'id': k, 'prompt': d, 'out': f'assets/char/{k}.webp', 'mode': 'icon', 'size': '256'})
    for k, d in HELMS.items():
        J.append({'id': k, 'prompt': HL.format(d), 'out': f'assets/icon2/{k}.webp', 'mode': 'icon', 'size': '128'})
    return J


if __name__ == '__main__':
    force = '--force' in sys.argv
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    todo = [j for j in jobs() if (not only or j['id'] in only) and (force or only or not os.path.exists(os.path.join(G.ROOT, j['out'])))]
    print('待生成 %d 张' % len(todo), flush=True)
    with ThreadPoolExecutor(6) as ex:
        ok = sum(ex.map(lambda j: bool(G.run(j)), todo))
    print('完成 %d/%d' % (ok, len(todo)))
