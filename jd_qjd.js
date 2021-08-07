/*
全民抢京豆
活动地址: 京东-领京豆-抢京豆  https://h5.m.jd.com/rn/8E544CDD476CD86C80C209F59E570461/index.html?has_native=0
活动时间：7.2-7.15
更新时间：2021-07-5 12:00
脚本兼容: QuantumultX, Surge,Loon, JSBox, Node.js
说明: 满160豆需要20人助力，每个用户目前只能助力2次不同的用户。
=================================Quantumultx=========================
[task_local]
#全民抢京豆
08 12 * * * https://raw.githubusercontent.com/linmudaye/linmudaye/main/jd_qjd.js, tag=全民抢京豆, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
=================================Loon===================================
[Script]
cron "08 12 * * *" script-path=https://raw.githubusercontent.com/linmudaye/linmudaye/main/jd_qjd.js,tag=全民抢京豆
===================================Surge================================
全民抢京豆 = type=cron,cronexp="08 12 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/linmudaye/linmudaye/main/jd_qjd.js
====================================小火箭=============================
全民抢京豆 = type=cron,script-path=https://raw.githubusercontent.com/linmudaye/linmudaye/main/jd_qjd.js, cronexpr="08 12 * * *", timeout=3600, enable=true
 */
const $ = new Env('全民抢京豆');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const UA = `jdpingou;iPhone;4.11.0;${Math.ceil(Math.random() * 2 + 12)}.${Math.ceil(Math.random() * 4)};${randomString(40)};`

function randomString(e) {
    e = e || 32;
    let t = "abcdefhijkmnprstwxyz2345678", a = t.length, n = "";
    for (i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
let helpAuthorFlag = true;//是否助力作者SH  true 助力，false 不助力
let helpInfo = []
let helpAuthorInfo = []
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
    };
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
$.helpStatus = true;
const JD_API_HOST = 'https://car-member.jd.com/api/';
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
        return;
    }
    if(helpAuthorFlag){
        try{
            helpAuthorInfo = await getAuthorShareCode('https://ghproxy.com/https://raw.githubusercontent.com/linmudaye/updateTeam/master/shareCodes/qjd.json');
        }catch (e) {}
        if(!helpAuthorInfo){helpAuthorInfo = [];}
    }
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1;
            $.isLogin = true;
            $.nickName = '';
            message = '';
            await TotalBean();
            console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
                continue
            }
            await $.wait(2000)
            await jdCar();
            $.helpStatus = true;
            for (let j = 0; j < helpInfo.length; j++) {
                let helpItem = helpInfo[j];
                $.groupCode = helpItem.groupCode
                $.shareCode = helpItem.shareCode
                $.activityId = helpItem.activityId


                if ($.UserName === helpItem.userName) {
                    continue
                }
                if ($.groupCode === undefined) {
                    continue
                }
                if (!$.helpStatus) {
                    continue
                }
                //抽取一名幸运娃儿助力
                if (helpAuthorFlag && helpAuthorInfo.length > 0){
                    let authorList = getRandomArrayElements(helpAuthorInfo,1);
                    let author = authorList[0];
                    console.log(`${$.UserName}给作者助力一次`)
                    await doHelp(author.groupCode, author.shareCode, author.activityId)
                    helpAuthorFlag = false;
                    await $.wait(1000)
                }
                console.log(`${$.UserName}助力-》》 ${helpItem.userName}`)
                await doHelp($.groupCode, $.shareCode, $.activityId)
                await $.wait(1000)

            }
        }
    }

})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })

async function jdCar() {
    await signGroupHit()
    await $.wait(1000)
    await getShareCode()
}

function getRandomStr(length, exclude = -1) {
    let num = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    if (exclude > -1) {
        num.splice(exclude, 1)
    }
    let str = ''
    for (let i = 0; i < length; i++) {
        str += String(num[Math.floor(Math.random() * num.length)])
    }
    return str
}

function signGroupHit() {
    return new Promise(resolve => {
        $.get({
            url: 'https://api.m.jd.com/client.action?functionId=signGroupHit&body=%7B%22activeType%22%3A2%7D&appid=ld&client=apple&clientVersion=9.5.4&networkType=wifi&osVersion=13.7&uuid=7b01d4690ef13716984dcfcf96068f36b41f6c51',
            headers: {
                'Cookie': cookie,
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Referer': 'https://h5.m.jd.com/rn/3MQXMdRUTeat9xqBSZDSCCAE9Eqz/index.html?has_native=0',
                'Accept-Encoding': 'gzip, deflate, br',
                'Host': 'api.m.jd.com',
                'User-Agent': UA,
                'Accept-Language': 'zh-cn'
            }
        }, (err, resp, data) => {
            resolve()
        })
    })
}

function getShareCode() {
    return new Promise(resolve => {
        let v_num1 = `${getRandomStr(5)}`
        $.get({
            url: 'https://api.m.jd.com/client.action?functionId=signBeanGroupStageIndex&body=%7B%22monitor_refer%22%3A%22%22%2C%22rnVersion%22%3A%223.9%22%2C%22fp%22%3A%22-1%22%2C%22shshshfp%22%3A%22-1%22%2C%22shshshfpa%22%3A%22-1%22%2C%22referUrl%22%3A%22-1%22%2C%22userAgent%22%3A%22-1%22%2C%22jda%22%3A%22-1%22%2C%22monitor_source%22%3A%22bean_m_bean_index%22%7D&appid=ld&client=apple&clientVersion=&networkType=&osVersion=&uuid=&jsonp=jsonp_' + String(Math.floor(Math.random() * 1000)) + '_' + v_num1,
            headers: {
                'Cookie': cookie,
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Referer': 'https://h5.m.jd.com/rn/3MQXMdRUTeat9xqBSZDSCCAE9Eqz/index.html?has_native=0',
                'Accept-Encoding': 'gzip, deflate, br',
                'Host': 'api.m.jd.com',
                'User-Agent': UA,
                'Accept-Language': 'zh-cn'
            }
        }, (err, resp, data) => {
            data = JSON.parse(data.replace(/jsonp_\d*_\d*\(/, '').replace(/\);?/, ''))
            let {groupCode, shareCode, sumBeanNumStr, activityMsg: {activityId}} = data.data
            helpInfo.push({groupCode, shareCode, sumBeanNumStr, activityId, userName: $.UserName})
            console.log("===========助力码===========\n ")
            console.log({groupCode, shareCode, sumBeanNumStr, activityId, userName: $.UserName})
            console.log("===========助力码===========\n ")
            resolve()
        })
    })
}

function doHelp(groupCode, shareCode, activityId) {
    return new Promise(resolve => {
        let v_num1 = `${getRandomStr(1, 0)}${getRandomStr(4)}`
        let url = `https://api.m.jd.com/client.action?functionId=signGroupHelp&body=%7B%22activeType%22%3A2%2C%22groupCode%22%3A%22${groupCode}%22%2C%22shareCode%22%3A%22${shareCode}%22%2C%22activeId%22%3A%22${activityId}%22%2C%22source%22%3A%22guest%22%7D&appid=ld&client=apple&clientVersion=10.0.4&networkType=wifi&osVersion=13.7&uuid=&openudid=&jsonp=jsonp_${Math.floor(Math.random() * 1000)}_${v_num1}`
        // console.log(decodeURIComponent(url))
        $.get({
            url,
            headers: {
                'Cookie': cookie,
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Referer': `https://h5.m.jd.com/rn/42yjy8na6pFsq1cx9MJQ5aTgu3kX/index.html?jklActivityId=115&source=SignSuccess&jklGroupCode=${groupCode}&ad_od=1&jklShareCode=${shareCode}`,
                'Accept-Encoding': 'gzip, deflate, br',
                'Host': 'api.m.jd.com',
                'User-Agent': UA,
                'Accept-Language': 'zh-cn'
            }
        }, (err, resp, data) => {
            data = JSON.parse(data.replace(/jsonp_\d*_\d*\(/, '').replace(/\);?/, ''))
            let {helpToast} = data.data
            let {respCode} = data.data
            if (respCode === 'SG209') {
                console.log(helpToast)
                $.helpStatus = false;
            } else {
                console.log(helpToast)
            }

            resolve()
        })
    })
}


function receiveMission(missionId) {
    return new Promise(resolve => {
        $.post(taskPostUrl('v1/user/mission/receive', {"missionId": missionId}), async (err, resp, data) => {
            try {
                if (err) {
                    data = JSON.parse(resp.body)
                    console.log(`${data.error.msg}`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data);
                        if (data.status) {
                            console.log("任务完成成功")
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function taskPostUrl(function_id, body = {}) {
    return {
        url: `${JD_API_HOST}${function_id}?timestamp=${new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000}`,
        body: JSON.stringify(body),
        headers: {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-cn",
            "Connection": "keep-alive",
            "Content-Type": "application/json;charset=UTF-8",
            "Host": "car-member.jd.com",
            "activityid": "39443aee3ff74fcb806a6f755240d127",
            "Referer": "https://h5.m.jd.com/babelDiy/Zeus/44bjzCpzH9GpspWeBzYSqBA7jEtP/index.html",
            "Cookie": cookie,
            "User-Agent": UA,
        }
    }
}

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": UA
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        if (data['retcode'] === 0) {
                            $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
                        } else {
                            $.nickName = $.UserName
                        }
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}

function getAuthorShareCode(url) {
    return new Promise(async resolve => {
        const options = {
            "url": `${url}`,
            "timeout": 10000,
            "headers": {
                "User-Agent": UA
            }
        };
        if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
            const tunnel = require("tunnel");
            const agent = {
                https: tunnel.httpsOverHttp({
                    proxy: {
                        host: process.env.TG_PROXY_HOST,
                        port: process.env.TG_PROXY_PORT * 1
                    }
                })
            }
            Object.assign(options, { agent })
        }
        $.get(options, async (err, resp, data) => {
            try {
                if (err) {
                } else {
                    if (data) data = JSON.parse(data)
                }
            } catch (e) {
                // $.logErr(e, resp)
            } finally {
                resolve(data || []);
            }
        })
        await $.wait(10000)
        resolve();
    })
}
/**
 * 随机从一数组里面取
 * @param arr
 * @param count
 * @returns {Buffer}
 */
function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
