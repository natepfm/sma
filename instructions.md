Okay I'm giving you all endpoint details and patterns

https://cheapestautorates.com/api/v1/create-session
this is happening cause it's creating a session and response is comingi like this
this is payload
redirectOrigin
: 
"https://s.civilcarcoverage.com/"
refererUrl
: 
"https://cheapestautorates.com/quotes/?c=23845&pcid=e504b581-514f-4d86-98a3-5d72b34e110e%7C%7C&source=%7Breplace%7D&pmclid=e504b581-514f-4d86-98a3-5d72b34e110e"
supportsCookies
: 
true

response is {"redirectUrl":null,"abTests":{}}

after this api is coming
https://cheapestautorates.com/api/v1/session

here is the response
{
    "session": {
        "affiliate": {
            "clientPublicKey": "23845",
            "keyword": null,
            "publisherClickId": "e504b581-514f-4d86-98a3-5d72b34e110e||",
            "remarketingCampaign": null,
            "source": "{replace}",
            "phone": "8334943943"
        },
        "isOver10kInDebt": false,
        "abTests": {},
        "tierId": "8",
        "clcktt": null,
        "queryParams": {
            "c": "23845",
            "pcid": "e504b581-514f-4d86-98a3-5d72b34e110e||",
            "source": "{replace}",
            "pmclid": "e504b581-514f-4d86-98a3-5d72b34e110e"
        }
    }
}

this api have the referer at the header
https://cheapestautorates.com/quotes/?c=23845&pcid=e504b581-514f-4d86-98a3-5d72b34e110e%7C%7C&source=%7Breplace%7D&pmclid=e504b581-514f-4d86-98a3-5d72b34e110e

and cookie as well




Year, make and model endpoing

for year api will be

https://savemaxauto.com/api/v1/auto-insurance/lookup/year

then for the make we need the year value param

for example if we choose 2021 then api wil will be

https://savemaxauto.com/api/v1/auto-insurance/lookup/make?year=2021

then once we will get the make list then we will choose any make the api will be

basically it will just add the makeId param

https://savemaxauto.com/api/v1/auto-insurance/lookup/model?year=2021&makeId=19

then they are asking for insurance detailes this is where an api like this

https://cheapestautorates.com/api/v1/auto-insurance/lookup/trim?modelId=9916

is giving us these responses

{
"modelId": 9916,
"trims": [
{
"id": 26813,
"name": "BASE",
"vin": "3MVDMAAY*MM******"
},
{
"id": 26809,
"name": "PREFERRED",
"vin": "3MVDMACL*MM******"
},
{
"id": 26811,
"name": "PREMIUM",
"vin": "3MVDMADL*MM******"
},
{
"id": 26810,
"name": "PREMIUM PLUS",
"vin": "3MVDMBEM*MM******"
},
{
"id": 26812,
"name": "SELECT",
"vin": "3MVDMBBM*MM******"
}
]
}

the whole payload of all questions look like this

{"hint":"noRoot","jornayaId":"A9D23AF3-7184-367B-90A5-8D686308FFD5","trustedFormCertUrl":"https://cert.trustedform.com/7ce435a96af86e03c8a9d9ef6854890900cf048b","customer":{"firstName":"Brittany","lastName":"Luis","email":"brittany.lui@gmail.com","phone":"2135551234","address":"1234 Main Street Los Angeles, CA 90015","city":"Vancouver","state":"WA","zip":"98666"},"vehicles":[{"annualMiles":11654,"collisionDeductible":"1000","comprehensiveDeductible":"1000","currentMileage":52000,"make":{"id":18,"name":"MAZDA"},"model":{"id":9916,"name":"CX-30"},"ownership":"OWN","trim":{"id":26813,"name":"BASE","vin":"3MVDMAAY*MM******"},"usedFor":"COMMUTE_VARIES","year":2021}],"drivers":[{"homeAutoBundle":true,"ageLicensed":16,"birthDate":"1994-05-08T00:00:00.000Z","creditRating":"GOOD","education":"ASSOCIATE","firstName":"Brittany","gender":"MALE","incidents":[],"lastName":"Luis","licenseState":"WA","licenseStatus":"ACTIVE","maritalStatus":"MARRIED","relationship":"SELF","residenceType":"OWN","sr22":false,"isMilitary":false}],"insurance":{"requestedCoverageType":"PREMIUM","requestedBodilyInjuryPerPerson":"100000","requestedBodilyInjuryPerIncident":"300000","requestedPropertyDamage":50000,"currentInsuranceCompany":"PROGRESSIVE","expirationDate":"2025-11-01T00:00:00.000Z","insuredSince":"2024-10-24T00:00:00.000Z","currentCoverageType":"STANDARD"},"mainConsent":{"consent":true,"text":"By clicking Get My Quote, you consent to CheapestAutoRates saving the information you entered and sharing it with insurance carriers so you can get the most up-to-date quotes, no matter what device you're using. You also agree to CheapestAutoRates's <a href='/privacy' target='_blank'>Privacy Policy</a> and <a href='/terms' target='_blank'>Terms of Service.</a>","linkedDocs":{"privacyPolicy":"2024-08-14T18:12:34.580Z","termsOfUse":"2024-08-14T18:12:36.863Z"}},"smsConsent":{"consent":true,"text":"By clicking 'Get My Quote' and submitting this form, I provide an electronic signature and express written consent to the SMS terms below and to receive marketing communications for insurance products & services via automatic telephone dialing system, including calls, SMS/MMS, pre-recorded calls or artificial voice messages from cheapestautorates.com and its <a href='/disclaimer#marketingPartners' target='_blank'>marketing partners</a>. Message and data rates may apply. I understand I may opt-out of phone and SMS communication by replying 'STOP' or 'HELP' for more info, or by contacting contact@cheapestautorates.com. I understand I will receive marketing communications to the phone number provided, which includes wireless numbers, and if applicable, numbers previously registered on the Federal and State DNC registries. See <a href='/sms' target='_blank'>SMS Policy</a> for more details. I certify that I am a US resident over 18, and all information submitted with this request is true and accurate to the best of my knowledge. Consent is not a condition to receive services or purchase products from cheapestautorates.com and if I do not consent, I can call (877) 512-3977 to speak to a professional to obtain an insurance quote. I acknowledge my consent can be revoked at any time. I understand and agree to the <a href='/terms' target='_blank'>Terms and Conditions</a> including mandatory arbitration.","linkedDocs":{"privacyPolicy":"2024-08-14T18:12:34.580Z","termsOfUse":"2024-08-14T18:12:36.863Z"}},"fccConsent":{"consent":false},"fingerprint":{"createSession":"019a1246-6a9e-774c-9ebf-99c8f7f5c41f"},"browserTime":"2025-10-24T17:03:31.496Z"}

after this we are getting the leadid from submit endpoint which is

https://savemaxauto.com/api/v1/auto-insurance/submit

the response we will get like this

{

"leadId": "7c6a0744-5f16-44b4-b0e3-97882d1ee02c"

}

after this we will get an offer wall page using this api endpoint

https://savemaxauto.com/api/v1/lp/ads

where we are setting the cookie in the header and we will get this response

{

"ads": [

{

"clickUrl": "https://loanredirect.com/c/7bf81eaa76582b7a45dd5e6baa0f61645be0c5cef7644d1d192a64c3361f91df96fc8e091b42",

"description": [

"Get a customized quote today and see what you could save",

"Fast, easy and reliable claims service available 24 hours a day",

"Trusted by millions of drivers to insure what’s important"

],

"logoUrl": "https://d29u10q7qlh006.cloudfront.net/i/i/47/kuFgeHlHQcPu6-u4y6Y-zjTrDAQ.gif",

"metadata": {

"impressionPixel": "",

"pixel": ""

},

"title": "Drivers who save by switching to Progressive save $964 on average",

"company": "Progressive",

"bidCents": 3195.61

},

{

"clickUrl": "https://loanredirect.com/c/9553b213325576092a3dd4e4cf83e92e6c5ae0e6692045058020600babe394628daf436a472b",

"description": [

"97% customer satisfaction rating",

"Agents in all 50 states",

"24/7 fast and friendly claims support"

],

"logoUrl": "https://d29u10q7qlh006.cloudfront.net/i/i/7/gFBURcAtAeau2Grhc2-ZI_9HyIU.gif",

"metadata": {

"impressionPixel": "",

"pixel": ""

},

"title": "See why NY drivers trust GEICO",

"company": "GEICO",

"bidCents": 2421.69

}

]

}


here sometimes I'm getting this api
https://cheapestautorates.com/page-data/quotes/page-data.json?c=23845&pcid=e504b581-514f-4d86-98a3-5d72b34e110e||&source={replace}&pmclid=e504b581-514f-4d86-98a3-5d72b34e110e&step=4


where the pcid is mentioned for the page and we are getting this payload
c: 23845
pcid: e504b581-514f-4d86-98a3-5d72b34e110e||
source: {replace}
pmclid: e504b581-514f-4d86-98a3-5d72b34e110e
step: 4

and response is
{
    "componentChunkName": "component---src-pages-quotes-tsx",
    "path": "/quotes/",
    "result": {"pageContext":{}},
    "staticQueryHashes": []}



    this endpoint 
https://cheapestautorates.com/api/v1/auto-complete-zip

provides the zip code which user inputs
here is the payload which it gets from the input
zip
: 
"98666"

and here is the response
{"city":"Vancouver","state":"WA"}