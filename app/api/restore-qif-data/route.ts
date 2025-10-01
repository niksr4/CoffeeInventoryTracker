import { NextResponse } from "next/server"
import { redis, KEYS, getRedisAvailability, checkRedisConnection } from "@/lib/redis"

// QIF data as a constant (your uploaded data)
const QIF_DATA = `Summary				
Total Transactions:	546			
Currencies:	Mixed/Unknown			
				
Total Income:	0			
Total Expenses:	10592312.5			
Net Balance:	-10592312.5			
				
				
Date	Payee/Description	Category	Memo	Amount
45748	Opening Balance	[HF Account]		0
45751	Drip Line Maintenance	150 Drip line Maintenance		-20725
45751	New Clear Rounding	211 New Clearing	9	-4050
45751	Nursery	210 Nursery	12	-5400
45751	Arabica Pruning	132 Arabica Pruning, Handling	14	-6050
45751	Pepper Picking	184 Pepper Havest, Process, Pack	4	-1800
45751	Irrigation Pipes Storage	143 Arabica Irrigation		-1275
45751	Pepper Picking	184 Pepper Havest, Process, Pack	salem 30+30	-48000
45751	Urea MOP Mgso4	155 Robusta, Cost Lime, Manure		-4850
45751	Hsd 80 liters	155 Robusta, Cost Lime, Manure	bal 100	-7120
45758	Drip Line Maintenance	150 Drip line Maintenance	40	-17650
45758	Pepper Picking	184 Pepper Havest, Process, Pack	8	-3500
45758	Nursery	210 Nursery	12	-5400
45758	Irrigation Pipes Storage	143 Arabica Irrigation	5	-2125
45758	Arabica Pruning	132 Arabica Pruning, Handling	41	-18075
45758	New Clear Rounding	211 New Clearing	4	-1800
45758	hsd 40 L	155 Robusta, Cost Lime, Manure	60	-3560
45758	Drip Fertigation Fertilizer	155 Robusta, Cost Lime, Manure	urea mop	-4850
45758	Shade Lopping O Y	154 Robusta Shade Temp, Perm.	Sunil	-35000
45765	Drip Line Maintenance	150 Drip line Maintenance	16	-7075
45765	Arabica Pruning	132 Arabica Pruning, Handling	60	-26375
45765	Nursery - O. T	210 Nursery	12	-5400
45765	New Clear Spray	211 New Clearing	12	-5325
45765	Borer Tracing	133 Arabica Borer Tracing	6	-2700
45765	Drip Fertigation Fertilizer	155 Robusta, Cost Lime, Manure	urea mop	-9700
45765	Tricel - 10 Lts.	211 New Clearing		-1104
45765	hsd 40 L	155 Robusta, Cost Lime, Manure	bal 20	-3560
45772	Robusta Handling And Desuckering	152 Robusta Pruning, Handling	38	-17250
45772	Drip Line Maintenance	150 Drip line Maintenance	5	-2200
45772	Borer Tracing	133 Arabica Borer Tracing	16	-7200
45772	New Clear Handling	211 New Clearing	3	-1350
45772	Nursery - O. T	210 Nursery	2	-90000
45772	Manure Mixing	136 Arabica Lime, Manuring	4	-1750
45772	Arabica Manuring	136 Arabica Lime, Manuring	49.5	-21938
45772	Robusta Glycel	151 Robusta Weeding	19	-8550
45772	Paddy Block Rounding	152 Robusta Pruning, Handling	9	-4050
45772	Glycel, Urea And Fix	151 Robusta Weeding		-6856
45772	Petrol 7 Lts	151 Robusta Weeding	13	-72100
45772	Arabica Fertilizer Cost	135 Arabica, Cost Lime, Manure	DAP MOP, Urea	-98625
45779	Arabica Glycel	131 Arabica Weeding, Trenching	59	-26175
45779	Robusta Handling And Desuckering	152 Robusta Pruning, Handling	56	-26925
45779	Rounding Robusta	152 Robusta Pruning, Handling	16	-7050
45779	Borer Tracing	133 Arabica Borer Tracing	19	-8500
45779	Leave Wages	106 Leave With Wages	7	-3150
45779	Stationary	110 Postage, Stationary		-3015
45779	Glycel, Urea And Fix	131 Arabica Weeding, Trenching		-19106
45779	Drip Fertigation Fertilizer	155 Robusta, Cost Lime, Manure	urea mop	-18120
45779	petrol 20	131 Arabica Weeding, Trenching	5	-2060
45779	Staff Wages KAB	101 Salaries And Allowances		-25000
45779	Staff Wages Muthu	101 Salaries And Allowances		-14000
45779	Drip Electricity	155 Robusta, Cost Lime, Manure		-9734
45779	Electrcity Bill	141 Arabica Processing & Drying	Pulper bore well	-20979
45786	Robusta Pruning	152 Robusta Pruning, Handling	19	-8325
45786	Robusta Handling And Desuckering	152 Robusta Pruning, Handling	19	-8400
45786	Borer Uprooting	133 Arabica Borer Tracing	14	-6200
45786	Robusta Manuring	155 Robusta, Cost Lime, Manure		-5325
45786	Borer Wrap spray	133 Arabica Borer Tracing	8	-3500
45786	Nuersry	210 Nursery	1	-45000
45786	Lent To MV	232 Lent	8 glycel	-3550
45786	Lent To PG	232 Lent	glyci	-7100
45786	Robusta Weedicide Spray	151 Robusta Weeding	12	-5300
45786	Glycel - 10400 Ml	151 Robusta Weeding		-14687
45786	Drip Fertigation Fertilizer	155 Robusta, Cost Lime, Manure	urea mop	-11835
45786	robusta fertilzer cost	155 Robusta, Cost Lime, Manure		-18120
45786	Petrol 25 Lts	151 Robusta Weeding	bal 20	-2575
45793	Robusta Weedicide Spray	151 Robusta Weeding	60	-26550
45793	borer wrapping	133 Arabica Borer Tracing	10	-4375
45793	Arabica Handling	132 Arabica Pruning, Handling	23	-10225
45793	Manure Mixing	156 Robusta , Manuring	3	-1325
45793	Robusta Manuring	156 Robusta , Manuring	19	-8375
45793	Glycil -22.5 Lt.	151 Robusta Weeding		-14126
45793	Petrol   15	151 Robusta Weeding	bal 35	-2575
45793	Robusta Manure Cost	155 Robusta, Cost Lime, Manure	estate mixed	-80960
45793	Spray Pipes	115 Machinary Maintenance		-66000
45793	Drip Fertigation Fertilizer	155 Robusta, Cost Lime, Manure	urea mop	-18120
45800	Robusta Manuring	156 Robusta , Manuring	40	-17600
45800	Manure Mixing	156 Robusta , Manuring	12	-5250
45800	Arabica Handling	132 Arabica Pruning, Handling	30	-13325
45800	borer wrapping	133 Arabica Borer Tracing	17	-7350
45800	Lent To PG And MV	232 Lent	22	-9600
45800	Palvan Lopping - (Contract}	134 Arabica Shade Work	8	-3450
45800	New Clear Rounding	211 New Clearing	2	-1800
45800	Robusta Pruning	152 Robusta Pruning, Handling	9	-3900
45800	Manure Loading	156 Robusta , Manuring		-42000
45800	Robusta Manure Cost	155 Robusta, Cost Lime, Manure	estate mixed	-137280
45800	HSD 20lts	112 Vehicle Running & Maint	bal 200	-1740
45807	Robusta Pruning	152 Robusta Pruning, Handling	61	-26850
45807	Palvan Shade	134 Arabica Shade Work	25	-10750
45807	New Clear Rounding	211 New Clearing	11	-4950
45807	shade trimming	154 Robusta Shade Temp, Perm.	3	-1350
45807	Hsd  20	120 Water Supply	180	-1740
45807	Shade Lopping	154 Robusta Shade Temp, Perm.	Sunil contract	-70000
45814	Robusta Pruning	152 Robusta Pruning, Handling	48	-21075
45814	New Clear Rounding	211 New Clearing	15	-6750
45814	Palvan Lopping - (Contract}	134 Arabica Shade Work	14	-6025
45814	Jungle Tree Cutting	134 Arabica Shade Work	5	-2200
45814	Pepper Pitting and planting	181 Pepper Planting, Upkeep	13	-5750
45814	Arabica Spray -	137 Arabica Spraying	22	-9775
45814	Arabica Spray - Chemicals Used	137 Arabica Spraying	contaf tricel micromin	-35660
45814	Petrol 10 Liters	137 Arabica Spraying	bal 25	-1030
45814	Petrol 10 Liters	134 Arabica Shade Work	bal 15	-1030
45814	Bonus 2024 25	103 Bonus Staff And Labour		-329800
45821	Robusta Glycel	151 Robusta Weeding	36	-16050
45821	Pepper Pitting and planting	181 Pepper Planting, Upkeep	18	-7950
45821	New Clear Rounding	211 New Clearing	5	-2250
45821	Palvan Shade	154 Robusta Shade Temp, Perm.	8	-3400
45821	Robusta Pruning	152 Robusta Pruning, Handling	22	-9750
45821	Pepper Drenching	183 Pepper Pest & Disease Cont.	10	-4500
45821	Shade Extra	154 Robusta Shade Temp, Perm.	5x100	-25000
45821	Glyce	151 Robusta Weeding	33.6 l plus urea	-16527
45821	pepper drenching chemicals	183 Pepper Pest & Disease Cont.	coc, marshall	-80000
45821	Shade Chopping	154 Robusta Shade Temp, Perm.	sunil	-70000
45821	Electricy Bill	155 Robusta, Cost Lime, Manure	drip	-18875
45821	Electricity Bill	120 Water Supply	borewell	-27333
45821	Electricity Bill Buildings	113 Electricity		-18995
45828	Robusta Pruning	152 Robusta Pruning, Handling	69 8 acres	-32175
45828	Shade Bonus	154 Robusta Shade Temp, Perm.	3	-1425
45828	Pepper Pitting	181 Pepper Planting, Upkeep	39	-18000
45828	New Clear Composting	211 New Clearing	20	-9375
45828	Pepper Drenching	181 Pepper Planting, Upkeep	10	-1875
45828	Shade Extra	154 Robusta Shade Temp, Perm.	3x125	-37500
45828	Pepper -plants	181 Pepper Planting, Upkeep	3400x17	-57800
45828	Shade Conract	154 Robusta Shade Temp, Perm.	10.5	-45000
45828	Cowdung	245 Organic Compost Manure	2 loads rama	-32000
45829	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 4@475.00; OS1: 1@450.00 | Notes: Pepper pitts dren	-2350
45829	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	HF: 2@475.00 | Notes: Decaragudi	-95000
45829	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 2@450.00	-4700
45829	Pepper Plants -cost	181 Pepper Plants -cost	HF: 2@475.00; OS1: 5@450.00 | Notes: Pepper pitts and	-3200
45831	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 6@475.00; OS1: 2@450.00 | Notes: Yervapadi	-3750
45831	New Clearing	211 New Clearing	HF: 3@475.00; OS1: 1@450.00 | Notes: Upkeek cardamom b	-1875
45831	Pepper Plants -cost	181 Pepper Plants -cost	HF: 2@475.00; OS1: 5@450.00 | Notes: Pepper pitts and	-3200
45832	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 4@475.00; OS1: 1@450.00 | Notes: Pitts drenching	-2350
45832	New Clearing	211 New Clearing	HF: 2@475.00 | Notes: Supply pitts	-95000
45832	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 3@450.00 | Notes: Yervapadi and 8ac	-5150
45832	Pepper Plants -cost	181 Pepper Plants -cost	HF: 2@475.00; OS1: 5@450.00 | Notes: Pepper pitts and	-3200
45832	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	Paid to sunil blocks no 11 10 b catimore no4	-30000
45833	New Clearing	211 New Clearing	HF: 2@475.00 | Notes: Cardamom block 169 nos Supply pi	-95000
45833	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 4@475.00; OS1: 1@450.00 | Notes: Pepper drenching	-2350
45833	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 2@475.00; OS1: 5@450.00 | Notes: Pepper pitts and	-3200
45833	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 3@450.00 | Notes: 8 care block	-5150
45833	Organic Compost Manure	245 Organic Compost Manure	Cowdung from ramu	-32000
45834	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00 | Notes: Venila complete	-95000
45834	New Clearing	211 New Clearing	HF: 4@475.00; OS1: 1@450.00 | Notes: Cardamom block Up	-2350
45834	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 2@475.00; OS1: 5@450.00 | Notes: Now in pathaya bl	-3200
45834	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 3@450.00 | Notes: 8acre one block a	-5150
45835	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00 | Notes: Supply pitts paddy	-95000
45835	New Clearing	211 New Clearing	HF: 4@475.00; OS1: 1@450.00 | Notes: New clear plants	-2350
45835	Pepper Plants -cost	181 Pepper Plants -cost	HF: 2@475.00; OS1: 5@450.00 | Notes: Pepper pitts and	-3200
45835	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS1: 3@450.00 | Notes: Yervapadi 8acre a	-4675
45835	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Tiller fuel	-1305
45835	Provident Fund, Insurance	102 Provident Fund, Insurance	May	-14769
45835	Provident Fund, Insurance	102 Provident Fund, Insurance	April	-10237
45835	Salaries And Allowances	101 Salaries And Allowances	Bopaiah  muthu	-40000
45835	Weather Protectives	118 Weather Protectives	Staff labours	-3100
45835	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	Devargudi  puttaraju sidha	-25000
45836	New Clearing	211 New Clearing	HF: 1@475.00; OS1: 1@450.00 | Notes: Stakes for planti	-92500
45836	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	HF: 1@475.00 | Notes: Shade devaragudi	-47500
45836	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 2@475.00; OS1: 5@450.00 | Notes: Pepper pitts and	-3200
45836	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 3@450.00 | Notes: Robusta pruning	-5150
45836	Robusta Pruning, Handling	152 Robusta Pruning, Handling	Lent from pgiri	-2375
45838	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 3@475.00 | Notes: Pepper drenching sanna thund	-1425
45838	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS1: 3@450.00 | Notes: Pepper pitts	-1825
45838	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 6@475.00; OS1: 2@450.00 | Notes: Charandi block 30	-3750
45838	Organic Compost Manure	245 Organic Compost Manure	Cowdung ramu	-48000
45838	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	Shade sunil	-15000
45839	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 4@475.00; OS1: 1@450.00 | Notes: Pepper drenching	-2350
45839	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS1: 4@450.00 | Notes: Pepper liming com	-2275
45839	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 3@450.00 | Notes: Vasu and 8acre pr	-5150
45839	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2850
45839	Salaries And Allowances	101 Salaries And Allowances	Dechamma college fees	-57800
45840	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 3@475.00; OS1: 1@450.00 | Notes: Pepper drenching	-1875
45840	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2375
45840	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 2@450.00 | Notes: 8Acre 65% complet	-4700
45840	lete	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 3@450.00 | Notes: Supply pitts padd	-1825
45840	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	HF: 1@475.00; OS1: 1@450.00 | Notes: Devaragudi 70% co	-92500
45840	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: Transformer block	-92500
45841	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	HF: 1@475.00; OS1: 1@450.00 | Notes: Dvaragudi block c	-92500
45841	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@475.00 | Notes: Transform block plants upkeep	-1425
45841	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: Machine weeding t	-92500
45841	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 3@450.00 | Notes: Robusta pitts	-1825
45841	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 4@450.00 | Notes: Printing 8acre co	-5600
45841	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri 6nos	-2850
45842	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	HF: 1@475.00; OS1: 1@450.00 | Notes: Palvan  shade tri	-92500
45842	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@475.00 | Notes: Transformer plants upkeep	-1425
45842	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: Transformer block	-92500
45842	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 3@450.00 | Notes: Pitts suply	-1825
45842	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 9@475.00; OS1: 3@450.00 | Notes: Pruning no2 and n	-5625
45842	Salaries And Allowances	101 Salaries And Allowances	Staff salaries	-40000
45842	Robusta Weeding	151 Robusta Weeding	Petrol for machine weeding	-1751
45842	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	Shade extra 5×125	-62500
45842	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri 5nos	-2375
45843	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	HF: 2@475.00; OS1: 2@450.00 | Notes: Transform block c	-1850
45843	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00 | Notes: No 5 block topping  complete	-95000
45843	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 3@450.00 | Notes: Pitts Transform b	-1825
45843	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 4@450.00 | Notes: Robusta pruning n	-5600
45843	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri 6nos	-2850
45845	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 5@450.00 | Notes: Robusta pitts in	-2725
45845	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS1: 4@450.00 | Notes: Boring block prun	-5125
45845	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	Sunil shade	-31000
45846	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@475.00 | Notes: Stakes for plants	-1425
45846	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: No 6 mini tiller	-92500
45846	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS1: 2@450.00 | Notes: Ksrekad clraring	-1375
45846	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 2@450.00 | Notes: Robusta pitts	-1375
45846	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 6@475.00; OS1: 4@450.00 | Notes: Robusta pruning b	-4650
45846	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2375
45847	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@475.00 | Notes: Stakes for planting	-1425
45847	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: No 6 mini tiller	-92500
45847	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS1: 2@450.00 | Notes: Karekad clearing	-1375
45847	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 2@450.00 | Notes: Supply pitts	-1375
45847	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS1: 4@450.00 | Notes: Boring block prun	-5125
45847	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From giri	-2375
45847	Drip line Maintenance	150 Drip line Maintenance	Drip materials	-7840
45848	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS1: 2@450.00 | Notes: Karekad clearing	-1375
45848	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: Mini tiller work	-92500
45848	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 4@475.00 | Notes: Stakes for planting	-1900
45848	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00; OS1: 2@450.00 | Notes: Pitts in no 4	-1850
45848	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS1: 4@450.00 | Notes: Robusta pruning b	-5125
45848	Robusta Pruning, Handling	152 Robusta Pruning, Handling	Phiri labour no 5	-2375
45849	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 2@450.00 | Notes: Gramaxone spray	-1375
45849	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 4@475.00 | Notes: Stakes	-1900
45849	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: Filler weeding	-92500
45849	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00; OS1: 2@450.00 | Notes: Robusta supply pi	-1850
45849	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS1: 4@450.00 | Notes: Pruning bungalow	-5125
45849	Robusta Weeding	151 Robusta Weeding	Gramaxone and fix	-2390
45849	Robusta Weeding	151 Robusta Weeding	Petrol for mini tiller	-1648
45849	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Hsd for tiller	-87000
45849	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Had for tractor	-1740
45849	Water Supply	120 Water Supply	Had for generator	-3480
45849	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2375
45850	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 2@450.00 | Notes: Gramaxone spray	-1375
45850	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 4@475.00 | Notes: Stakes	-1900
45850	Robusta Weeding	151 Robusta Weeding	HF: 2@475.00 | Notes: Tiller weeding	-95000
45850	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS1: 2@450.00 | Notes: Robusta pitts	-1375
45850	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS1: 3@450.00 | Notes: Bungalow block	-4675
45850	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2375
45852	Drip line Maintenance	150 Drip line Maintenance	HF: 1@475.00; OS1: 5@450.00 | Notes: Drip line checkin	-2725
45852	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@475.00 | Notes: Stakes for supply	-1425
45852	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 8@475.00; OS1: 4@450.00 | Notes: Bungalow block co	-5600
45853	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: Mini tiller weedi	-92500
45853	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@450.00 | Notes: Stakes	-1350
45853	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 15@475.00; OS1: 5@450.00 | Notes: Charandi block a	-9375
45853	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2375
45854	Robusta Weeding	151 Robusta Weeding	HF: 2@450.00 | Notes: No 6 weeding mini tiller	-90000
45854	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@450.00 | Notes: Stakes for  supply	-90000
45854	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 15@475.00; OS1: 5@450.00 | Notes: No 4 and 6 pruni	-9375
45854	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2375
45855	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS1: 1@450.00 | Notes: Jeevan boundary	-1163
45855	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS1: 1@450.00 | Notes: Mini tiller weedi	-92500
45855	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@450.00 | Notes: Stakes	-1350
45855	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 13@475.00; OS1: 4@450.00 | Notes: Robusta printing	-7975
45855	Robusta Weeding	151 Robusta Weeding	Petrol for weeding	-2060
45855	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-1900
45859	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45859	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS: 1@450.00 | Notes: No 9 mini tiller	-92500
45859	Robusta Fence Maint	158 Robusta Fence Maint	HF: 2@475.00; OS: 1@450.00 | Notes: Fence work	-1400
45859	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 9@475.00; OS: 4@450.00 | Notes: Robusta pruning	-6075
45859	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-1900
45860	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45860	Arabica Manuring	136 Arabica Manuring	HF: 2@475.00; OS: 1@450.00 | Notes: Manure mix	-1400
45860	Robusta Fence Maint	158 Robusta Fence Maint	HF: 2@475.00; OS: 1@450.00 | Notes: Bungalow fence tri	-1400
45860	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 11@475.00; OS: 4@450.00 | Notes: Robusta pruning n	-7025
45860	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-1900
45861	Drip line Maintenance	150 Drip line Maintenance	HF: 4@475.00; OS: 5@450.00 | Notes: Drip line work	-4150
45861	Arabica Pruning, Handling	132 Arabica Pruning, Handling	HF: 13@475.00; OS: 4@450.00 | Notes: Arabica handling	-7975
45861	Drip line Maintenance	150 Drip line Maintenance	From pgiri	-47500
45861	Arabica Pruning, Handling	132 Arabica Pruning, Handling	From pgiri	-1900
45862	Drip line Maintenance	150 Drip line Maintenance	HF: 4@475.00; OS: 5@450.00 | Notes: Drip checking	-4150
45862	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 6@475.00; OS: 2@450.00 | Notes: Robusta handling	-3750
45862	Arabica Pruning, Handling	132 Arabica Pruning, Handling	HF: 6@475.00; OS: 2@450.00 | Notes: Arabica handling c	-3750
45862	Drip line Maintenance	150 Drip line Maintenance	From pgiri	-47500
45862	Arabica Pruning, Handling	132 Arabica Pruning, Handling	From pgiri	-1425
45863	Drip line Maintenance	150 Drip line Maintenance	HF: 3@475.00; OS: 5@450.00 | Notes: Drip checking	-3675
45863	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 4@475.00 | Notes: A. Side handling	-1900
45863	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 9@475.00; OS: 4@450.00 | Notes: Pruning	-6075
45863	Capital Account	233 Capital Account	Rake for manure	-3700
45863	Arabica Manuring	136 Arabica Manuring	Manure mix	-51500
45863	Robusta Weeding	151 Robusta Weeding	Mini tiller	-1030
45863	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-1900
45864	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 5@450.00 | Notes: Drip checking 3a	-3200
45864	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 3@475.00 | Notes: Handling paddy	-1425
45864	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS: 4@450.00 | Notes: Robusta pruning	-5125
45864	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-2375
45866	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 3@475.00 | Notes: Paddy handling	-1425
45866	Arabica Manuring	136 Arabica Manuring	HF: 2@475.00; OS: 1@450.00 | Notes: Manure mix	-1400
45866	Arabica Manuring	136 Arabica Manuring	HF: 8@475.00; OS: 8@450.00 | Notes: Arabica manure	-7400
45866	Provident Fund, Insurance	102 Provident Fund, Insurance	July	-14085
45866	Arabica Manuring	136 Arabica Manuring	From pgiri	-1425
45867	Robusta Weeding	151 Robusta Weeding	OS: 3@450.00	-1350
45867	Drip line Maintenance	150 Drip line Maintenance	HF: 4@475.00; OS: 1@450.00 | Notes: Drip checking	-2350
45867	New Clearing	211 New Clearing	HF: 3@475.00 | Notes: New clear round ing	-1425
45867	Arabica Manuring	136 Arabica Manuring	HF: 7@475.00; OS: 8@450.00 | Notes: Arabica manure	-6925
45867	Provident Fund, Insurance	102 Provident Fund, Insurance	PF paid July	-20733
45867	Robusta, Cost Lime, Manure	155 Robusta, Cost Lime, Manure	7Acres Robusta manure	-30380
45867	Arabica, Cost Lime, Manure	135 Arabica, Cost Lime, Manure	18 acres Arabica manure	-78120
45867	Arabica Manuring	136 Arabica Manuring	From pgiri	-1425
45867	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	Cxr plants from dinesh	-7500
45868	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 2@450.00 | Notes: Drip checking	-1850
45868	Robusta Weeding	151 Robusta Weeding	HF: 4@475.00; OS: 4@450.00 | Notes: Paddy smash weedin	-3700
45868	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 5@475.00 | Notes: Paddy planting  91 nos complete	-2375
45868	Robusta Weeding	151 Robusta Weeding	From pgiri	-95000
45868	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	Stakes from pgiri	-95000
45869	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 1@475.00; OS: 2@450.00 | Notes: Bodo spray	-1375
45869	Robusta Weeding	151 Robusta Weeding	HF: 2@475.00; OS: 3@450.00 | Notes: Paddy weeding	-2300
45869	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 2@450.00 | Notes: Drip checking	-1850
45869	Arabica Spraying	137 Arabica Spraying	HF: 4@475.00; OS: 1@450.00 | Notes: Arabica cantaf spr	-2350
45869	Salaries And Allowances	101 Salaries And Allowances	Staff	-40000
45869	Arabica Spraying	137 Arabica Spraying	From pgiri	-1900
45870	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 3@450.00 | Notes: Drip line	-2300
45870	Robusta Weeding	151 Robusta Weeding	HF: 4@475.00; OS: 3@450.00 | Notes: Slash weeding	-3250
45870	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 1@475.00; OS: 2@450.00 | Notes: Pepper bodo spray	-1375
45870	Arabica Spraying	137 Arabica Spraying	HF: 7@475.00; OS: 1@450.00 | Notes: Arabica spray	-3775
45870	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	Petrol	-83200
45870	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	Chemicals	-3344
45870	Arabica Spraying	137 Arabica Spraying	Petrol	-1040
45870	Arabica Spraying	137 Arabica Spraying	Arabica spray chemicals	-23424
45870	Arabica Spraying	137 Arabica Spraying	From pgiri	-1900
45871	Drip line Maintenance	150 Drip line Maintenance	HF: 1@475.00; OS: 3@450.00 | Notes: Drip line work	-1825
45871	Robusta Weeding	151 Robusta Weeding	HF: 4@475.00 | Notes: Cardamom  block	-1900
45871	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	HF: 1@475.00; OS: 2@450.00 | Notes: Pepper spray	-1375
45871	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 7@475.00; OS: 4@450.00 | Notes: Robusta pruning	-5125
45871	Pepper Pest & Disease Cont.	183 Pepper Pest & Disease Cont.	Pepper spray	-2498
45871	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri	-1900
45873	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	OS: 2@450.00 | Notes: Machine wedding big block	-90000
45873	Drip line Maintenance	150 Drip line Maintenance	HF: 1@475.00; OS: 3@450.00 | Notes: Drip 3a welding pe	-1825
45873	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@475.00; OS: 4@450.00 | Notes: Transform block co	-3225
45873	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 5@475.00; OS: 4@450.00 | Notes: Pepper planting cs	-4175
45873	Machinary Maintenance	115 Machinary Maintenance	Pulper	-1780
45874	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	HF: 1@475.00; OS: 2@450.00 | Notes: M weeding	-1375
45874	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 2@450.00 | Notes: Drip	-1850
45874	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 4@475.00; OS: 4@450.00 | Notes: Planting	-3700
45874	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 5@475.00; OS: 5@450.00 | Notes: Pepper planting	-4625
45874	Robusta, Cost Lime, Manure	155 Robusta, Cost Lime, Manure	Loading charge	-87500
45875	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	HF: 2@475.00; OS: 2@450.00 | Notes: Machine weeding	-1850
45875	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 2@450.00 | Notes: Drip checking 3a	-1850
45875	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 4.5@475.00; OS: 4@450.00 | Notes: Robusta planting	-3937.5
45875	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 5@475.00; OS: 5@450.00 | Notes: Planting	-4625
45876	Drip line Maintenance	150 Drip line Maintenance	HF: 1@475.00; OS: 2@450.00 | Notes: Drip line	-1375
45876	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	HF: 2@475.00; OS: 2@450.00 | Notes: Machine weeding	-1850
45876	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 4@475.00; OS: 4@450.00 | Notes: Robusta planting	-3700
45876	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 5@475.00; OS: 5@450.00 | Notes: Pepper planting	-4625
45876	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Tractor 20 tiller 10	-2674
45877	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS: 2@450.00 | Notes: Machine weeding	-1375
45877	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 2@450.00 | Notes: Drip	-1850
45877	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 4@475.00; OS: 4@450.00 | Notes: Robusta planting	-3700
45877	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 5@475.00; OS: 5@450.00 | Notes: Pepper planting	-4625
45877	Robusta Weeding	151 Robusta Weeding	Petrol for machine weeding	-1248
45877	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Tractor parts from Narayan	-3425
45877	Pepper planting, upkeep	181 Pepper Planting, Upkeep	Pepper plants	-11550
45877	Robusta, Cost Lime, Manure	155 Robusta, Cost Lime, Manure	Mgso4 drip	-2400
45877	Robusta, Cost Lime, Manure	155 Robusta, Cost Lime, Manure	Urea mop mix drip	-10400
45877	Drip line Maintenance	150 Drip line Maintenance	Drip	-1780
45877	Drip line Maintenance	150 Drip line Maintenance	Genrator	-52000
45877	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	Machine weeding	-1040
45878	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS: 3@450.00 | Notes: Stakes	-1825
45878	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS: 2@450.00 | Notes: Machine weeding	-1375
45878	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 2@450.00 | Notes: Drip checking	-1850
45878	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 8@475.00; OS: 6@450.00 | Notes: Pepper planting	-6500
45878	Machinary Maintenance	115 Machinary Maintenance	Pulpar o.t faijur	-20000
45878	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Tractor parts	-3425
45878	Robusta Weeding	151 Robusta Weeding	Machine weeding	-1248
45880	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS: 3@450.00 | Notes: Stakes	-1825
45880	Drip line Maintenance	150 Drip line Maintenance	HF: 1@475.00; OS: 3@450.00 | Notes: Drip check	-1825
45880	Robusta Weeding	151 Robusta Weeding	HF: 1@475.00; OS: 2@450.00 | Notes: Machine weeding	-1375
45880	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 9@475.00; OS: 6@450.00 | Notes: Pepper planting	-6975
45880	Robusta Weeding	151 Robusta Weeding	Machine weeding	-2080
45881	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00; OS: 2@450.00 | Notes: Stakes	-1850
45881	Drip line Maintenance	150 Drip line Maintenance	HF: 1@475.00; OS: 3@450.00 | Notes: Drip	-1825
45881	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	HF: 1@475.00; OS: 2@450.00 | Notes: Machine weeding	-1375
45881	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 6@475.00; OS: 8@450.00 | Notes: Pepper planting	-6450
45881	Drip line Maintenance	150 Drip line Maintenance	Drip welding	-52000
45881	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	Machine weeding Arabica	-93600
45882	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00; OS: 2@450.00 | Notes: Stakes	-1850
45882	Robusta Liming, Manuring	156 Robusta Liming, Manuring	OS: 2@450.00 | Notes: Manure mix	-90000
45882	Drip line Maintenance	150 Drip line Maintenance	HF: 1@475.00; OS: 1@450.00 | Notes: Drip	-92500
45882	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 2@450.00 | Notes: Boundary weeding	-1375
45882	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 7@475.00; OS: 8@450.00 | Notes: Planting	-6925
45882	Robusta Liming, Manuring	156 Robusta Liming, Manuring	Manure mix	-52000
45882	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	Sunil shade	-45000
45883	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00; OS: 2@450.00 | Notes: Stakes	-1850
45883	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 1@475.00; OS: 3@450.00 | Notes: Manure mix	-1825
45883	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 2@450.00 | Notes: Fence b side	-1375
45883	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 8@475.00; OS: 7@450.00 | Notes: Planting	-6950
45883	Machinary Maintenance	115 Machinary Maintenance	Redbee service	-22211
45883	Machinary Maintenance	115 Machinary Maintenance	Pulpar service	-192250
45884	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00; OS: 2@450.00 | Notes: Stakes	-1850
45884	Robusta Fence Maint	158 Robusta Fence Maint	HF: 2@475.00; OS: 2@450.00 | Notes: Fence	-1850
45884	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 1@475.00; OS: 3@450.00 | Notes: Manure mix	-1825
45884	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 8@475.00; OS: 8@450.00 | Notes: Planting	-7400
45884	Pepper planting, upkeep	181 Pepper Planting, Upkeep	Pepper plants 1100nis	-23100
45884	Robusta Fence Maint	158 Robusta Fence Maint	Boundaries	-1248
45884	Drip line Maintenance	150 Drip line Maintenance	Drip	-1780
45884	Leave With Wages	106 Leave With Wages	Leave wages	-6175
45884	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Sunil mechanic tractor	-3100
45885	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 2@475.00; OS: 2@450.00 | Notes: Srakes	-1850
45885	Robusta Fence Maint	158 Robusta Fence Maint	HF: 2@475.00; OS: 2@450.00 | Notes: Fence	-1850
45885	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 1@475.00; OS: 3@450.00 | Notes: Manure mix	-1825
45885	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 8@475.00; OS: 8@450.00 | Notes: Planting	-7400
45887	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 1@475.00; OS: 2@450.00 | Notes: Stakes	-1375
45887	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 0.5@475.00; OS: 5@450.00 | Notes: Arabica pitts	-2487.5
45887	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 3@450.00 | Notes: Fence	-1825
45887	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 7@475.00; OS: 2@450.00 | Notes: Planting	-4225
45887	Robusta Shade Temp, Perm.	154 Robusta Shade Temp, Perm.	Sunil shsde	-35000
45888	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 6@450.00 | Notes: Arabica pitts	-2700
45888	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 3@450.00 | Notes: Fence	-1825
45888	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 5@475.00; OS: 6@450.00 | Notes: Planting	-5075
45889	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 2@450.00 | Notes: Fence	-1375
45889	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 1@475.00; OS: 2@450.00 | Notes: Manure mix	-1375
45889	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 9@475.00; OS: 11@450.00 | Notes: Robusta manure	-9225
45890	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 3@450.00 | Notes: Arabica pitts	-1350
45890	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 2@450.00 | Notes: Fence	-1375
45890	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 9@475.00; OS: 10@450.00 | Notes: Robusta manure	-8775
45891	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 1@475.00; OS: 3@450.00 | Notes: Arabica pitts	-1825
45891	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 2@450.00 | Notes: Fence	-1375
45891	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 10@475.00; OS: 10@450.00 | Notes: Robusta manure	-9250
45891	Robusta Fence Maint	158 Robusta Fence Maint	Petrol fence work	-4264
45891	Robusta, Cost Lime, Manure	155 Robusta, Cost Lime, Manure	Mop rs 132600. Urea 26130. Rock 48750	-207480
45892	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	HF: 1@475.00; OS: 2@450.00 | Notes: Arabica  wedding	-1375
45892	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 1@475.00; OS: 1@450.00 | Notes: Arabica pitts	-92500
45892	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 9@475.00; OS: 11@450.00 | Notes: Robusta manure	-9225
45894	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Robusta handling	-2700
45894	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	HF: 1@475.00; OS: 2@450.00 | Notes: M weeding	-1375
45894	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS: 7@450.00 | Notes: Pepper pitts	-3625
45894	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 9@475.00 | Notes: Planting	-4275
45894	Pepper planting, upkeep	181 Pepper Planting, Upkeep	Pepper plants	-18900
45894	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	Petrol Arabica weeding	-2080
45895	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Handling	-2700
45895	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	HF: 2@475.00; OS: 2@450.00 | Notes: M weeding	-1850
45895	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS: 8@450.00 | Notes: Pitting	-4075
45895	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 11@475.00 | Notes: Planting	-5225
45896	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Handling	-2700
45896	Robusta Weeding	151 Robusta Weeding	OS: 3@450.00 | Notes: M weeding	-1350
45896	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS: 7@450.00 | Notes: Pepper pitts	-3625
45896	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 5@475.00 | Notes: Pepper planting	-2375
45896	Robusta Liming, Manuring	156 Robusta Liming, Manuring	HF: 5@475.00 | Notes: Robusta manure	-2375
45896	Pepper planting, upkeep	181 Pepper Planting, Upkeep	Sumo for Pepper planting	-2700
45896	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Tractor	-1780
45896	Electricity	113 Electricity	Electric bill	-14221
45896	Drip line Maintenance	150 Drip line Maintenance	Electric bill	-8148
45896	Salaries And Allowances	101 Salaries And Allowances	Electric bill	-7251
45896	Water Supply	120 Water Supply	Electric bill	-4184
45897	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Handling	-2700
45897	Robusta Weeding	151 Robusta Weeding	OS: 3@450.00 | Notes: M weeding	-1350
45897	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 7@450.00 | Notes: Supply pitts	-3150
45897	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 9.5@475.00 | Notes: Planting	-4512.5
45898	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 3@450.00 | Notes: Pitts	-1350
45898	Robusta Weeding	151 Robusta Weeding	OS: 3@450.00 | Notes: M weeding	-1350
45898	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 1@475.00; OS: 4@450.00 | Notes: Pitting	-2275
45898	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Handling	-2700
45898	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 8@475.00 | Notes: Planting	-3800
45898	Robusta Weeding	151 Robusta Weeding	Petrol Robusta weeding	-1872
45899	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	OS: 2@450.00 | Notes: M weeding	-90000
45899	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Handling	-2700
45899	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45899	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 1@475.00; OS: 5@450.00 | Notes: Arabica pitts	-2725
45899	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 9@475.00 | Notes: Robusta planting	-4275
45901	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45901	Robusta Weeding	151 Robusta Weeding	OS: 2@450.00 | Notes: M weeding	-90000
45901	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 5@450.00 | Notes: Arabica pitts	-2250
45901	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Robusta handling	-2700
45901	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 9@475.00 | Notes: Planting	-4275
45901	Water Supply	120 Water Supply	Pillar generator	-1780
45902	Adjust	122 Miscellaneous		-150
45902	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 1@450.00 | Notes: Fence	-92500
45902	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45902	Robusta Weeding	151 Robusta Weeding	OS: 2@450.00 | Notes: M weeding	-90000
45902	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 4@450.00 | Notes: Pitts	-1800
45902	Robusta Pruning, Handling	152 Robusta Pruning, Handling	HF: 9@475.00; OS: 6@450.00 | Notes: Handling	-6975
45902	Robusta Weeding	151 Robusta Weeding	Machine weeding	-3640
45903	Robusta Fence Maint	158 Robusta Fence Maint	HF: 1@475.00; OS: 1@450.00 | Notes: Fence	-92500
45903	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 6@450.00 | Notes: Pitts	-2700
45903	Robusta Weeding	151 Robusta Weeding	OS: 3@450.00 | Notes: Machine weed	-1350
45903	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 10@475.00 | Notes: Planting	-4750
45903	Robusta Pruning, Handling	152 Robusta Pruning, Handling	OS: 6@450.00 | Notes: Handling	-2700
45903	Leave With Wages	106 Leave With Wages		-3325
45904	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 3@450.00 | Notes: Srakes	-1350
45904	Robusta Fence Maint	158 Robusta Fence Maint	HF: 2@475.00 | Notes: Fence	-95000
45904	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	OS: 2@450.00 | Notes: Arabica  weeding	-90000
45904	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 5@450.00 | Notes: Pitts	-2250
45904	Robusta Weeding	151 Robusta Weeding	OS: 5@450.00 | Notes: Slash weeding	-2250
45904	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 9@475.00; OS: 1@450.00 | Notes: Planting	-4725
45904	Capital Account	233 Capital Account	Battery for solar Fence	-14000
45904	Capital Account	233 Capital Account	Solar fence materials	-830000
45904	Drip line Maintenance	150 Drip line Maintenance	Drip pumps anoop	-24340
45905	Robusta Fence Maint	158 Robusta Fence Maint	HF: 3@475.00 | Notes: Slash weeding  fence	-1425
45905	Robusta Fence Maint	158 Robusta Fence Maint	HF: 2@475.00 | Notes: Fence	-95000
45905	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	Arabica weeding	-2080
45912	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	Petrol	-3640
45912	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Hsd for tractor tiller	-2670
45912	Machinary Maintenance	115 Machinary Maintenance	Ups battery	-21300
45912	Capital Account	233 Capital Account	Solar fence	-59000
45912	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	M.weeding	-5400
45912	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	Stakes	-7200
45912	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	Pitting	-11275
45912	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	Planting	-28250
45912	Robusta Weeding	151 Robusta Weeding		-1350
45912	Robusta Fence Maint	158 Robusta Fence Maint	Fence	-16975
45917	Robusta Liming, Manuring	156 Robusta Liming, Manuring	Transport charge	-31605
45919	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	Petrol	-3120
45919	Robusta Liming, Manuring	156 Robusta Liming, Manuring	Lime transport charges	-31752
45919	Robusta Liming, Manuring	156 Robusta Liming, Manuring	Lime unloading	-3675
45919	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	Stakes	-6750
45919	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	M.weeding	-4525
45919	Robusta Fence Maint	158 Robusta Fence Maint	Fence	-2350
45919	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	Pitting	-11400
45919	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	Planting	-37600
45920	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45920	Robusta Weeding	151 Robusta Weeding	HF: 2@475.00 | Notes: M weeding	-95000
45920	Arabica Weeding, Trenching	131 Arabica Weeding, Trenching	OS: 1@450.00 | Notes: Arabica m weeding	-45000
45920	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	OS: 4@450.00 | Notes: Pitts	-1800
45920	Arabica Supplies, Upkeep	139 Arabica Supplies, Upkeep	HF: 9@475.00; OS: 6@450.00 | Notes: Planting	-6975
45922	Drip line Maintenance	150 Drip line Maintenance	OS: 3@450.00 | Notes: Drip line	-1350
45922	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS: 2@450.00 | Notes: Pepper upkeep	-1375
45922	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45922	Robusta Weeding	151 Robusta Weeding	OS: 3@450.00 | Notes: M. Weeding	-1350
45922	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 6@475.00; OS: 4@450.00 | Notes: Planting	-4650
45923	Drip line Maintenance	150 Drip line Maintenance	HF: 3@475.00; OS: 4@450.00 | Notes: Drip line	-3225
45923	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS: 2@450.00 | Notes: Upkeep	-1375
45923	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45923	Robusta Weeding	151 Robusta Weeding	OS: 2@450.00 | Notes: M weeding.	-90000
45923	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 7@475.00; OS: 4@450.00 | Notes: Planting	-5125
45923	Robusta Weeding	151 Robusta Weeding	Out side slash weeding	-4000
45924	Drip line Maintenance	150 Drip line Maintenance	HF: 3@475.00; OS: 4@450.00 | Notes: Drip line	-3225
45924	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 2@475.00; OS: 2@450.00 | Notes: Pepper  upkeep	-1850
45924	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 3@450.00 | Notes: Stakes	-1350
45924	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 9@475.00; OS: 4@450.00 | Notes: Robusta planting	-6075
45924	Robusta Weeding	151 Robusta Weeding	Smash weeding out size lab 10nos	-5000
45925	Robusta Weeding	151 Robusta Weeding	OS: 2@450.00 | Notes: M weeding	-90000
45925	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 2@450.00 | Notes: Drip line work	-1850
45925	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 2@475.00; OS: 2@450.00 | Notes: Pepper upkeep	-1850
45925	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	OS: 5@450.00 | Notes: Pitts	-2250
45925	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 7@475.00; OS: 4@450.00 | Notes: Robusta planting	-5125
45925	Robusta Weeding	151 Robusta Weeding	Outside	-5000
45926	Drip line Maintenance	150 Drip line Maintenance	HF: 2@475.00; OS: 7@450.00 | Notes: Drip maintain	-4100
45926	Robusta Weeding	151 Robusta Weeding	OS: 2@450.00 | Notes: M weeding paddy	-90000
45926	Pepper planting, upkeep	181 Pepper Planting, Upkeep	HF: 1@475.00; OS: 2@450.00 | Notes: Plants upkeep	-1375
45926	Supplies Planting, Upkeep	159 Supplies Planting, Upkeep	HF: 3@475.00 | Notes: Plants upkeep.	-1425
45926	Robusta Weeding	151 Robusta Weeding	HF: 3@475.00; OS: 4@450.00 | Notes: Slash weeding	-3225
45926	Drip line Maintenance	150 Drip line Maintenance	Drip welding	-83200
45926	Robusta Weeding	151 Robusta Weeding	M.weeding	-2912
45926	Vehicle Running -Tractor	112 Vehicle Running -Tractor	Tractor and tiller	-2670
45926	Drip line Maintenance	150 Drip line Maintenance	Drip genrator	-1780
45926	Robusta Processing & Drying	161 Robusta Processing & Drying	Picking matt	-15200
45926	Robusta Weeding	151 Robusta Weeding	Out side 10nos Saturday 10	-10000
45926	Arabica Borer Tracing	133 Arabica Borer Tracing	Borer pgiri 2nos	-95000
45926	Robusta Weeding	151 Robusta Weeding	P Giri  2nos	-95000
45926	ZnSO4 27.5 Kg	155 Robusta, Cost Lime, Manure	27.5	-1045`

// Helper function to convert Excel date serial to JavaScript Date
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569)
  const utc_value = utc_days * 86400
  const date_info = new Date(utc_value * 1000)
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate())
}

// Helper function to parse labor information from memo
function parseLaborInfo(memo: string): {
  hfCount: number
  hfCost: number
  outsideEntries: Array<{ count: number; cost: number }>
} {
  const hfMatch = memo.match(/HF:\s*(\d+(?:\.\d+)?)@(\d+(?:\.\d+)?)/)
  const outsideMatches = [...memo.matchAll(/OS\d*:\s*(\d+(?:\.\d+)?)@(\d+(?:\.\d+)?)/g)]

  return {
    hfCount: hfMatch ? Number.parseFloat(hfMatch[1]) : 0,
    hfCost: hfMatch ? Number.parseFloat(hfMatch[2]) : 475,
    outsideEntries: outsideMatches.map((match) => ({
      count: Number.parseFloat(match[1]),
      cost: Number.parseFloat(match[2]),
    })),
  }
}

// Helper function to determine if transaction is labor-related
function isLaborTransaction(memo: string, category: string): boolean {
  // Check if memo contains labor patterns
  if (memo.includes("HF:") || memo.includes("OS:") || memo.includes("@")) {
    return true
  }

  // Check category codes that typically involve labor
  const laborCodes = [
    "131",
    "132",
    "133",
    "134",
    "135",
    "136",
    "137",
    "138",
    "139",
    "140",
    "141",
    "143",
    "150",
    "151",
    "152",
    "153",
    "154",
    "155",
    "156",
    "157",
    "158",
    "159",
    "160",
    "161",
    "162",
    "163",
    "181",
    "182",
    "183",
    "184",
    "185",
    "191",
    "200",
    "201",
    "202",
    "204",
    "206",
    "210",
    "211",
    "212",
    "213",
    "214",
    "215",
    "216",
    "217",
    "218",
    "219",
    "220",
    "221",
    "222",
    "245",
  ]

  const categoryCode = category.split(" ")[0]
  return laborCodes.includes(categoryCode)
}

// Main restoration function
async function restoreQifData() {
  try {
    if (!getRedisAvailability()) {
      await checkRedisConnection()
      if (!getRedisAvailability()) {
        throw new Error("Redis not available")
      }
    }

    console.log("🚀 Starting QIF data restoration...")

    // Parse the QIF data
    const lines = QIF_DATA.split("\n").filter((line) => line.trim())
    const transactions = []

    // Skip header lines and process transaction data
    let dataStarted = false
    for (const line of lines) {
      if (line.startsWith("Date\t")) {
        dataStarted = true
        continue
      }

      if (!dataStarted || !line.includes("\t")) continue

      const parts = line.split("\t")
      if (parts.length >= 5) {
        const [dateSerial, description, category, memo, amount] = parts

        // Skip opening balance and zero amounts
        if (description === "Opening Balance" || Number.parseFloat(amount) === 0) continue

        const date = excelDateToJSDate(Number.parseFloat(dateSerial))
        const absoluteAmount = Math.abs(Number.parseFloat(amount))
        const categoryCode = category.split(" ")[0]
        const categoryName = category.substring(categoryCode.length).trim()

        transactions.push({
          date,
          description,
          category,
          categoryCode,
          categoryName,
          memo: memo || "",
          amount: absoluteAmount,
        })
      }
    }

    console.log(`📊 Parsed ${transactions.length} transactions from QIF file`)

    // Separate into labor and consumable deployments
    const laborDeployments = []
    const consumableDeployments = []

    for (const transaction of transactions) {
      const deploymentId = `restored-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const deploymentDate = transaction.date.toISOString()

      if (isLaborTransaction(transaction.memo, transaction.category)) {
        // Parse labor information
        const laborInfo = parseLaborInfo(transaction.memo)

        const laborEntries = []
        if (laborInfo.hfCount > 0) {
          laborEntries.push({
            laborCount: laborInfo.hfCount,
            costPerLabor: laborInfo.hfCost,
          })
        }

        laborInfo.outsideEntries.forEach((entry) => {
          laborEntries.push({
            laborCount: entry.count,
            costPerLabor: entry.cost,
          })
        })

        // If no specific labor entries found, estimate based on amount
        if (laborEntries.length === 0) {
          const estimatedCount = Math.round(transaction.amount / 475)
          if (estimatedCount > 0) {
            laborEntries.push({
              laborCount: estimatedCount,
              costPerLabor: 475,
            })
          }
        }

        const totalCost = laborEntries.reduce((sum, entry) => sum + entry.laborCount * entry.costPerLabor, 0)

        laborDeployments.push({
          id: deploymentId,
          code: transaction.categoryCode,
          reference: transaction.categoryName,
          laborEntries,
          totalCost: totalCost || transaction.amount,
          date: deploymentDate,
          user: "restored-from-qif",
          notes: transaction.memo ? `${transaction.description} | ${transaction.memo}` : transaction.description,
        })
      } else {
        // Create consumable deployment
        consumableDeployments.push({
          id: deploymentId,
          date: deploymentDate,
          code: transaction.categoryCode,
          reference: transaction.categoryName,
          amount: transaction.amount,
          notes: transaction.memo ? `${transaction.description} | ${transaction.memo}` : transaction.description,
          user: "restored-from-qif",
        })
      }
    }

    // Get existing deployments
    const existingLaborDeployments = (await redis.get(KEYS.LABOR_DEPLOYMENTS)) || []
    const existingConsumableDeployments = (await redis.get(KEYS.CONSUMABLE_DEPLOYMENTS)) || []

    // Merge with existing data (add restored data at the beginning)
    const updatedLaborDeployments = [...laborDeployments, ...existingLaborDeployments]
    const updatedConsumableDeployments = [...consumableDeployments, ...existingConsumableDeployments]

    // Save to Redis
    await redis.set(KEYS.LABOR_DEPLOYMENTS, updatedLaborDeployments)
    await redis.set(KEYS.CONSUMABLE_DEPLOYMENTS, updatedConsumableDeployments)

    const totalValue = transactions.reduce((sum, t) => sum + t.amount, 0)

    console.log("✅ QIF data restoration completed successfully!")
    console.log(`📈 Summary:`)
    console.log(`   • Labor deployments restored: ${laborDeployments.length}`)
    console.log(`   • Consumable deployments restored: ${consumableDeployments.length}`)
    console.log(`   • Total transactions processed: ${transactions.length}`)
    console.log(`   • Total value restored: ₹${totalValue.toLocaleString()}`)
    console.log(`   • Date range: April 1, 2025 - September 26, 2025`)

    return {
      success: true,
      message: "QIF data restoration completed successfully",
      summary: {
        laborDeployments: laborDeployments.length,
        consumableDeployments: consumableDeployments.length,
        totalTransactions: transactions.length,
        totalValue: totalValue,
        dateRange: "April 1, 2025 - September 26, 2025",
      },
    }
  } catch (error) {
    console.error("❌ Error during QIF data restoration:", error)
    throw error
  }
}

export async function GET() {
  try {
    const result = await restoreQifData()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore QIF data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    const result = await restoreQifData()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore QIF data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
