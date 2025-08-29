let peopleData = [];
let map;

// -------- 省份清單 --------
const provinces = [
  "北京","天津","上海","重慶",
  "河北","山西","遼寧","吉林","黑龍江","哈爾濱","瀋陽",
  "江蘇","浙江","安徽","福建","江西","山東","綏遠","遼北","廣州",
  "河南","湖北","湖南","廣東","海南","嫩江","察哈爾","山東","南京",
  "四川","貴州","雲南","陝西","甘肅","青海","漢口","熱河","興安",
  "廣西","蒙古","新疆","西藏","寧夏","安東","松江","青島","貴州",
  "香港","澳門","臺灣","西康","大連","天津","北平","合江","重慶"
];

// -------- 領域關鍵字 --------
const domains = {
  "政界": ["政府","議會","立法院","行政院","部長","市長","省長","官員"],
  "軍方": ["軍","師","旅","營","司令","將軍","少校","上校"],
  "商界": ["公司","銀行","企業","董事長","總經理","廠長"],
  "教育界": ["學校","教授","教師","大學","中學","校長"]
};

// -------- 判斷省份 --------
function detectProvince(place){
    if(!place) return "其他";
    for(let prov of provinces){
        if(place.includes(prov)){
            return prov;
        }
    }
    return "其他";
}

// -------- 判斷領域 (回傳陣列) --------
function detectDomains(experienceList){
    let matched = [];
    if(!experienceList || !Array.isArray(experienceList)) return [];
    for(let [domain, keywords] of Object.entries(domains)){
        for(let exp of experienceList){
            if(keywords.some(kw => exp.includes(kw))){
                if(!matched.includes(domain)) matched.push(domain);
            }
        }
    }
    return matched;
}

// -------- 初始化地圖 --------
function initMap(){
    map = L.map('map').setView([25, 121], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map);

    peopleData.forEach(p=>{
        if(p.lat && p.lon){
            let photo_html = p.photo ? `<img src="${p.photo}" width="80"><br>` : '';
            let edu = Array.isArray(p.education) ? p.education.join('<br>') : '無';
            let exp = Array.isArray(p.experience) ? p.experience.join('<br>') : '無';
            let popup = `
                ${photo_html}
                <b>${p.name}</b><br>
                年齡: ${p.age}<br>
                性別: ${p.gender}<br>
                單位: ${p.unit}<br>
                <b>學歷:</b><br>${edu}<br>
                <b>經歷:</b><br>${exp}
            `;
            L.circleMarker([p.lat,p.lon],{
                radius:1, color:'blue', fillColor:'blue', fillOpacity:0.7
            }).addTo(map).bindPopup(popup);
        }
    });
}

// -------- 統計圖表 --------
function initCharts(){
    let gender_count = {"男":0,"女":0,"其他":0};
    let province_count = {};
    let ages = [];

    peopleData.forEach(p=>{
        gender_count[p.gender] = (gender_count[p.gender]||0)+1;
        province_count[p.province] = (province_count[p.province]||0)+1;
        if(typeof p.age==='number') ages.push(p.age);
    });

    // 男女比例
    new Chart(document.getElementById('genderChart'),{
        type:'pie',
        data:{
            labels:['男','女','其他'],
            datasets:[{
                data:[gender_count['男'],gender_count['女'],gender_count['其他']],
                backgroundColor:['#36A2EB','#FF6384','#FFCE56']
            }]
        },
        options:{responsive:true, maintainAspectRatio:true, aspectRatio:1}
    });

    // 省份比例
    new Chart(document.getElementById('provinceChart'),{
        type:'pie',
        data:{
            labels:Object.keys(province_count),
            datasets:[{
                data:Object.values(province_count),
                backgroundColor:[
                  '#FF6384','#36A2EB','#FFCE56','#AA66CC','#99CC00',
                  '#FF9900','#66CC99','#FF9966','#CCCC33','#6699CC'
                ]
            }]
        },
        options:{responsive:true, maintainAspectRatio:true, aspectRatio:1}
    });

    // 年齡分布
    let ageLabels=[];
    for(let i=0;i<=100;i+=5) ageLabels.push(i+'-'+(i+4));
    let ageCounts = new Array(ageLabels.length).fill(0);
    ages.forEach(a=>{
        let idx=Math.floor(a/5);
        if(idx>=ageCounts.length) idx=ageCounts.length-1;
        ageCounts[idx]++;
    });
    new Chart(document.getElementById('ageChart'),{
        type:'bar',
        data:{
            labels:ageLabels,
            datasets:[{label:'人數', data:ageCounts, backgroundColor:'#36A2EB'}]
        },
        options:{responsive:true, maintainAspectRatio:false}
    });

    // 領域分布
    for(let domain of Object.keys(domains)){
        let yes = peopleData.filter(p => p.domains.includes(domain)).length;
        let no = peopleData.length - yes;

        new Chart(document.getElementById(domain+"Chart"), {
            type: 'pie',
            data: {
                labels: ["是", "否"],
                datasets: [{
                    data: [yes, no],
                    backgroundColor: ["#36A2EB", "#CCCCCC"]
                }]
            },
            options:{responsive:true, maintainAspectRatio:true, aspectRatio:1}
        });
    }

    // 特殊案例（最年長、最年輕）
    let sorted = peopleData.filter(p=>typeof p.age==='number').sort((a,b)=>b.age-a.age);
    if(sorted.length>0){
        document.getElementById('oldest-person').innerText=`最年長：${sorted[0].name} (${sorted[0].age}歲)`;
        document.getElementById('youngest-person').innerText=`最年輕：${sorted[sorted.length-1].name} (${sorted[sorted.length-1].age}歲)`;
    }
}

// -------- 自製表格（省份合併） --------
function initTable(){
    let grouped = {};
    peopleData.forEach(p => {
        if(!grouped[p.province]) grouped[p.province] = [];
        grouped[p.province].push(p);
    });

    let table = document.getElementById("peopleTable");
    table.innerHTML = `
        <thead>
            <tr>
                <th>省份</th>
                <th>代表名單</th>
            </tr>
        </thead>
        <tbody>
        ${Object.entries(grouped).map(([prov, persons]) => `
            <tr>
                <td>${prov} (${persons.length}人)</td>
                <td>
                    ${persons.map(p => 
                        `<a href="#" class="person-link" data-name="${p.name}">${p.name}</a>`
                    ).join("， ")}
                </td>
            </tr>
        `).join("")}
        </tbody>
    `;

    table.querySelectorAll(".person-link").forEach(el => {
        el.addEventListener("click", function(e){
            e.preventDefault();
            let person = peopleData.find(p => p.name === this.dataset.name);
            if(person){
                let html = `
                    <h3>${person.name}</h3>
                    <p><b>性別：</b>${person.gender}</p>
                    <p><b>年齡：</b>${person.age}</p>
                    <p><b>籍貫：</b>${person.birthplace}</p>
                    <p><b>單位：</b>${person.unit}</p>
                    <p><b>學歷：</b><br>${Array.isArray(person.education)?person.education.join('<br>'):'無'}</p>
                    <p><b>經歷：</b><br>${Array.isArray(person.experience)?person.experience.join('<br>'):'無'}</p>
                    ${person.photo? `<img src="${person.photo}" width="120">` : ''}
                `;
                let modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `<div class="modal-box">${html}<button onclick="this.parentNode.parentNode.remove()">關閉</button></div>`;
                document.body.appendChild(modal);
            }
        });
    });
}

// -------- 載入 JSON --------
fetch("data/people_data.json")
.then(res=>res.json())
.then(data=>{
    peopleData = data.map(p => {
        let age = parseInt(p.age);
        return {
            ...p,
            age: isNaN(age) ? null : age,
            province: detectProvince(p.birthplace), // ← 改用籍貫
            domains: detectDomains(p.experience)
        };
    });
    initMap();
    initCharts();
    initTable();
});
