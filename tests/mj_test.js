// 秘境：推层规则与数值（从 eg_mj.js 抽取纯函数测试）
const fs=require('fs');const src=fs.readFileSync(__dirname+'/../eg_mj.js','utf8');
const grab=re=>{const m=src.match(re);if(!m)throw new Error('missing '+re);return m[0]};
const code=grab(/const EG_MJ=\{[\s\S]*?\n crys:[^\n]*\n/)+'\n'+grab(/function egMjNext[\s\S]*?\n return\{cur,wall,farm\}\}/);
const {EG_MJ,egMjNext}=new Function(code+';return{EG_MJ,egMjNext}')();
let ok=0,bad=0;const t=(n,c)=>{if(c)ok++;else{bad++;console.log('失败：'+n)}};
let M={cur:1,wall:0,farm:0};
for(let i=0;i<5;i++)M=egMjNext(M,M.cur,'up');t('连胜升层',M.cur===6&&!M.wall);
M=egMjNext(M,6,'fail');t('失败退一层',M.cur===5&&M.wall===6&&M.farm===0);
for(let i=0;i<9;i++){M=egMjNext(M,M.cur,'up');t('墙下刷层不升 '+i,M.cur===5)}
M=egMjNext(M,5,'up');t('刷满10次再试墙层',M.cur===6&&M.wall===6);
M=egMjNext(M,6,'up');t('过墙清除',M.cur===7&&M.wall===0);
M=egMjNext(M,7,'stay');t('超时不升层',M.cur===7);
t('1层不再下降',egMjNext({cur:1,wall:0,farm:0},1,'fail').cur===1);
t('等级封顶99',EG_MJ.ml(1)===85&&EG_MJ.ml(70)===99&&EG_MJ.ml(200)===99);
t('倍率',Math.abs(EG_MJ.hp(10)-2.1589)<1e-3&&Math.abs(EG_MJ.dmg(10)-1.4106)<1e-3);
t('暗金套装概率封顶',Math.abs(EG_MJ.leg(1)-0.12)<1e-9&&EG_MJ.leg(100)===0.6);
t('秘晶',EG_MJ.crys(9)===1&&EG_MJ.crys(10)===2&&EG_MJ.gemCost(0)===5&&EG_MJ.gemCost(3)===20);
console.log(`\n结果：通过 ${ok}，失败 ${bad}`);process.exit(bad?1:0);
