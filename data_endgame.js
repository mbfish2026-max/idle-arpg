'use strict';
// ===== 终局系统数据（第五阶段）。全部名称原创。 =====
// 悬赏令（每日/每周）
const EG_BOUNTY={
 dailyN:5,
 types:{kill:{n:'猎杀',d:(z,n)=>`在 ${z} 击杀 ${n} 只怪物`},clear:{n:'清剿',d:z=>`彻底肃清 ${z}（打完全部波次）`},boss:{n:'讨首',d:(z,b)=>`在 ${z} 讨伐首领 ${b}`}},
 weekly:[{t:'wkill',n:'百骸之誓',goal:4000,d:n=>`任意区域击杀 ${n} 只怪物`},{t:'wclear',n:'焦土之誓',goal:50,d:n=>`肃清任意区域 ${n} 次`},{t:'wboss',n:'弑首之誓',goal:25,d:n=>`讨伐任意首领 ${n} 次`},{t:'wrift',n:'深隙之誓',goal:10,d:n=>`完成虚隙 ${n} 次`}],
 cache:{n:'暮誓宝匣',ic:'🎁'},wcache:{n:'夜誓重匣',ic:'🧰'}};
