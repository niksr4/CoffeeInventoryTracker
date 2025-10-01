import { NextResponse } from "next/server"
import { sql, createTables, testConnection } from "@/lib/neon"

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

// QIF data (your complete dataset)
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
45842	Robusta Pruning, Handling	152 Robusta Pruning, Handling	From pgiri 5nos	-2375`

export async function POST() {
  try {
    console.log("🚀 Starting QIF data restoration to Neon...")

    // Test Neon connection and create tables
    const neonConnected = await testConnection()
    if (!neonConnected) {
      throw new Error("Failed to connect to Neon database")
    }

    await createTables()

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

    const restoredData = {
      laborDeployments: 0,
      laborEntries: 0,
      consumableDeployments: 0,
      errors: [] as string[],
    }

    // Process each transaction
    for (const transaction of transactions) {
      const deploymentId = `qif-restored-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const deploymentDate = transaction.date.toISOString()

      try {
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

          // Insert labor deployment
          await sql`
            INSERT INTO labor_deployments (id, code, reference, total_cost, date, user_name, notes)
            VALUES (${deploymentId}, ${transaction.categoryCode}, ${transaction.categoryName}, 
                    ${totalCost || transaction.amount}, ${deploymentDate}, ${"restored-from-qif"}, 
                    ${transaction.memo ? `${transaction.description} | ${transaction.memo}` : transaction.description})
            ON CONFLICT (id) DO NOTHING
          `
          restoredData.laborDeployments++

          // Insert labor entries
          for (const entry of laborEntries) {
            await sql`
              INSERT INTO labor_entries (deployment_id, labor_count, cost_per_labor)
              VALUES (${deploymentId}, ${entry.laborCount}, ${entry.costPerLabor})
            `
            restoredData.laborEntries++
          }
        } else {
          // Create consumable deployment
          await sql`
            INSERT INTO consumable_deployments (id, date, code, reference, amount, notes, user_name)
            VALUES (${deploymentId}, ${deploymentDate}, ${transaction.categoryCode}, ${transaction.categoryName},
                    ${transaction.amount}, ${transaction.memo ? `${transaction.description} | ${transaction.memo}` : transaction.description}, 
                    ${"restored-from-qif"})
            ON CONFLICT (id) DO NOTHING
          `
          restoredData.consumableDeployments++
        }
      } catch (error) {
        restoredData.errors.push(`Failed to process transaction ${transaction.description}: ${error}`)
      }
    }

    const totalValue = transactions.reduce((sum, t) => sum + t.amount, 0)

    console.log("✅ QIF data restoration to Neon completed!")
    console.log(`📈 Summary:`)
    console.log(`   • Labor deployments restored: ${restoredData.laborDeployments}`)
    console.log(`   • Labor entries restored: ${restoredData.laborEntries}`)
    console.log(`   • Consumable deployments restored: ${restoredData.consumableDeployments}`)
    console.log(`   • Total transactions processed: ${transactions.length}`)
    console.log(`   • Total value restored: ₹${totalValue.toLocaleString()}`)
    console.log(`   • Errors: ${restoredData.errors.length}`)

    return NextResponse.json({
      success: true,
      message: "QIF data restoration to Neon completed successfully",
      summary: {
        ...restoredData,
        totalTransactions: transactions.length,
        totalValue: totalValue,
        dateRange: "April 1, 2025 - September 26, 2025",
      },
    })
  } catch (error) {
    console.error("❌ QIF restoration to Neon failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore QIF data to Neon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const neonConnected = await testConnection()

    const neonData = {
      available: neonConnected,
      inventoryTransactions: 0,
      laborDeployments: 0,
      laborEntries: 0,
      consumableDeployments: 0,
    }

    if (neonConnected) {
      try {
        const [invCount] = await sql`SELECT COUNT(*) as count FROM inventory_transactions`
        const [laborCount] = await sql`SELECT COUNT(*) as count FROM labor_deployments`
        const [laborEntriesCount] = await sql`SELECT COUNT(*) as count FROM labor_entries`
        const [consumableCount] = await sql`SELECT COUNT(*) as count FROM consumable_deployments`

        neonData.inventoryTransactions = Number.parseInt(invCount.count)
        neonData.laborDeployments = Number.parseInt(laborCount.count)
        neonData.laborEntries = Number.parseInt(laborEntriesCount.count)
        neonData.consumableDeployments = Number.parseInt(consumableCount.count)
      } catch (error) {
        console.log("Tables not found in Neon, will be created during restoration")
      }
    }

    return NextResponse.json({
      success: true,
      neon: neonData,
      restorationReady: neonConnected,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check restoration status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
