const electron = require("electron")
const url = require('url')
const path = require('path')
const pie = require("puppeteer-in-electron")
const puppeteer = require("puppeteer-core")
const fs = require('fs')
const xlsx = require('xlsx')
const { dialog } = require("electron")
const {app, BrowserWindow, ipcMain, globalShortcut, WebRequest }= electron

//Initialize
pie.initialize(app)
//SET ENV
//process.env.NODE_ENV = 'production'
const cookiespath = path.join(__dirname, 'Persistent')
app.setPath('userData',cookiespath)
let mainwindow
let designwindow
let sfwindow
const productionpath = path.join(__dirname,'Production')

class Design {
    constructor(){}
    getNewSalesDesign(){
        
        (async () => {
            //Initiate 
            
            
            const browser = await pie.connect(app, puppeteer)
            const page = await pie.getPage(browser, sfwindow)
            await page.goto('https://posigen.my.salesforce.com/00O3o000005l9f3')
            //Get New Project Information
            try{
                await page.waitForSelector('tbody > #headerRow_0 > th:nth-child(9) > a > strong', {timeout: 1000})
            }
            catch{
                await page.waitFor(1000)
                await page.waitForSelector('tbody > #headerRow_0 > th:nth-child(9) > a > strong', {timeout: 1000})
            }
            await page.click('tbody > #headerRow_0 > th:nth-child(9) > a > strong')  
            await page.waitFor(1000)
            //n=4 is the first. n=5 is the second, so on.
            var n = 4
            var element = await page.$('#fchArea > table > tbody > tr:nth-child('+n+') > td:nth-child(6)')
            var text = await page.evaluate(element => element.textContent, element);
            var split = text.split('@')
            var names = split[0]
            var address = split[1]
            console.log(address)
            var element = await page.$('#fchArea > table > tbody > tr:nth-child('+n+') > td:nth-child(5)')
            var state = await page.evaluate(element => element.textContent, element);
            if(address.includes('Louisiana') || address.includes('LA') || address.includes('LOUISIANA')){state = 'Louisiana'}
            if(address.includes('Connecticut') || address.includes('CT') || address.includes('CONNECTICUT')){state = 'Connecticut'}
            if(address.includes('New Jersey') || address.includes('NJ') || address.includes('NEW JERSEY')){state = 'New Jersey'}
            var element = await page.$('#fchArea > table > tbody > tr:nth-child('+n+') > td:nth-child(3)')
            var opid = await page.evaluate(element => element.textContent, element);
            console.log(opid)
            var target = page.$('#fchArea > table > tbody > tr:nth-child('+n+') > td:nth-child(7) > a')
            //Set Object Properties
            this.address = address
            this.opid = opid
            this.state = state

            // await page.waitFor(500)
            //Create Project in Aurora tab
            const page2 = await pie.getPage(browser, designwindow)
            await page2.goto('https://app.aurorasolar.com/projects')
            var NewProject = 'div.btn.btn-main.btn-primary.btn-right'
            var name = names.split(' ')
            var first = name[0]
            var last = name[1]
            await page2.waitForSelector(NewProject)
            await page2.click(NewProject)
            await page2.keyboard.type(address)
            await page2.keyboard.press('Tab')
            await page2.keyboard.press('Backspace')
            await page2.keyboard.press('Backspace')
            await page2.keyboard.press('Backspace')
            await page2.keyboard.type(opid)
            await page2.keyboard.press('Tab')

            await page2.keyboard.type(first)
            await page2.keyboard.press('Tab')
            await page2.keyboard.type(last)

            if (state == 'New Jersey'){
            await page2.click('svg.aicon-commercial-building')
            }else{}
            await page2.waitForSelector('div.modal-button.modal-btn-primary')
            await page2.click('div.modal-button.modal-btn-primary')
            await page2.waitFor(1000)
            await page2.waitForSelector('span.clickable.gray.btn.btn-sm.btn-link')
            await page2.click('span.clickable.gray.btn.btn-sm.btn-link')


            await page2.keyboard.press('Enter')
            await page2.waitFor(500)
            //Obtain Deal info      
            await (await target).click()
            await page.waitFor(1000)
            var deal = page.url()
            console.log(deal)
            //Read Notes
            let note
            try{
                await page.waitForSelector('#\\30 0N3o00000990vk_ileinner')
                var element = await page.$('#\\30 0N3o00000990vk_ileinner')
                note = await page.evaluate(element => element.textContent, element);
                console.log(note)
            }catch{
                note = ''
            }

            //Check Deco
            let deco
            var element = await page.$('#\\30 0N3o000009Xnbl_ileinner')
            var props = await element.getProperty('title')
            if (props._remoteObject.value == 'Checked'){
                deco = 'true'
            }else{deco = 'false'}
            console.log(deco)
            
            // Mark Complete
            var edit = '.btn:nth-child(3)'
            await page.waitForSelector(edit)
            await page.click(edit)
            var date = '#ep > div.pbBody > div:nth-child(19) > table > tbody > tr:nth-child(2) > td.dataCol.col02 > span > span > a'
            try{
                
                await page.waitForSelector(date)
                await page.click(date)
            }catch{
                await page.waitForSelector(edit)
                await page.click(edit)
                
            }
            
            await page.waitForSelector(date)
            await page.click(date)
            await page.waitForSelector('#topButtonRow > input:nth-child(1)')
            //Save
            await page.click('#topButtonRow > input:nth-child(1)')
            //Communicate with HTML page
            this.deco = deco
            this.note = note
            mainwindow.webContents.send('update:address', {msg:this.address})

            let alert = `DecoTech?: ${deco} \nDesign Notes: ${note}`
            if(deco == 'true'){dialog.showMessageBox(designwindow, {message: alert})
        console.log('first')}
            if(note.length !== 1){dialog.showMessageBox(designwindow, {message: alert})
            console.log('second')}
            


        })().catch(err => {
            console.log(err);
    })
        
    }
    getNewProject(){
        (async () => {
            //Initiate 
            const browser = await pie.connect(app, puppeteer)
            const page = await pie.getPage(browser, sfwindow)
    
            //Look for necessary project info
            await page.waitFor(1000)
            
            var element = await page.$('#\\30 0Nd0000009Ey3w_ileinner')
            var text = await page.evaluate(element => element.textContent, element);
            var split = text.split('@')
            var names = split[0]
            var address = split[1]
            console.log(names)
            console.log(address)
            
            var element = await page.$('#\\30 0N3o00000990vk_ileinner')
            var note = await page.evaluate(element => element.textContent, element);
            console.log(note)

            let deco
            var element = await page.$('#\\30 0N3o000009Xnbl_ileinner')
            var props = await element.getProperty('title')
            if (props._remoteObject.value == 'Checked'){
                deco = 'true'
            }else{deco = 'false'}
            console.log(deco)

            var element = await page.$('#\\30 0Nd0000009F0pK_ileinner')
            var opid = await page.evaluate(element => element.textContent, element);
            console.log(opid)
            var state
            if(address.includes('Louisiana') || address.includes('LA') || address.includes('LOUISIANA')){state = 'Louisiana'}
            if(address.includes('Connecticut') || address.includes('CT') || address.includes('CONNECTICUT')){state = 'Connecticut'}
            if(address.includes('New Jersey') || address.includes('NJ') || address.includes('NEW JERSEY')){state = 'New Jersey'}
            console.log(state)
            var dealURL = page.url()
            console.log(dealURL)

            //Set Object Properties
            this.address = address
            this.opid = opid
            this.state = state
            this.deal = dealURL
            //Create Project in Aurora tab
            const page2 = await pie.getPage(browser, designwindow)
            await page2.goto('https://app.aurorasolar.com/projects')
            var NewProject = 'div.btn.btn-main.btn-primary.btn-right'
            var name = names.split(' ')
            var first = name[0]
            var last = name[1]
            try{
                await page2.waitForSelector(NewProject, {timeout: 1000})
            }catch{
                console.log('Whoops')
                try{
                    await page2.waitForSelector(NewProject, {timeout: 1000})
                }catch{
                    
                    console.log('Whoops 2')
                    await page2.waitFor(1000)
                    await page2.waitForSelector(NewProject, {timeout: 1000})
                }

            }

            await page2.click(NewProject)
            await page2.keyboard.type(address)
            await page2.keyboard.press('Tab')
            await page2.keyboard.press('Backspace')
            await page2.keyboard.press('Backspace')
            await page2.keyboard.press('Backspace')
            await page2.keyboard.type(opid)
            await page2.keyboard.press('Tab')
    
            await page2.keyboard.type(first)
            await page2.keyboard.press('Tab')
            await page2.keyboard.type(last)
    
            if (state == 'New Jersey'){
            await page2.click('svg.aicon-commercial-building')
            }else{}
            await page2.waitForSelector('div.modal-button.modal-btn-primary')
            await page2.click('div.modal-button.modal-btn-primary')
            await page2.waitFor(1000)

            //Create Design
            await page2.waitForSelector('span.clickable.gray.btn.btn-sm.btn-link')
            await page2.click('span.clickable.gray.btn.btn-sm.btn-link')
            await page2.keyboard.press('Enter')
            await page2.waitFor(1000)
            await browser.close()

            //Set Object Properties
            this.deco = deco
            this.note = note

            let alert = `DecoTech?: ${deco} \nDesign Notes: ${note}`
            if(deco == 'true'){dialog.showMessageBox(designwindow, {message: alert})
        console.log('first')}
            if(note.length !== 1){dialog.showMessageBox(designwindow, {message: alert})
            console.log('second')}
            mainwindow.webContents.send('update:address', {msg:this.address})


            })().catch(err => {
                console.log(err);
        })
    }
    setCurrentDesign(){
        (async () => {
            
            //Initiate 
            const browser = await pie.connect(app, puppeteer)
            const page = await pie.getPage(browser, sfwindow)
            //Look for necessary project info
            await page.waitFor(50)
    
            var element = await page.$('#\\30 0Nd0000009Ey3w_ileinner')
            var text = await page.evaluate(element => element.textContent, element);
            var split = text.split('@')
            var names = split[0]
        
            var address = split[1]
            
            console.log(names)
            console.log(address)

            var element = await page.$('#\\30 0N3o00000990vk_ileinner')
            var note = await page.evaluate(element => element.innerText, element);
            console.log(note.length)


            let deco
            
            var element = await page.$('#\\30 0N3o000009Xnbl_chkbox')
            var props = await element.getProperty('title')
            if (props._remoteObject.value == 'Checked'){
                deco = 'true'
            }else{deco = 'false'}
            console.log(deco)
            var element = await page.$('#\\30 0Nd0000009F0pK_ileinner')
            var opid = await page.evaluate(element => element.textContent, element);
            console.log(opid)
            var state 
            if(address.includes('Louisiana') || address.includes('LA') || address.includes('LOUISIANA')){state = 'Louisiana'}
            if(address.includes('Connecticut') || address.includes('CT') || address.includes('CONNECTICUT')){state = 'Connecticut'}
            if(address.includes('New Jersey') || address.includes('NJ') || address.includes('NEW JERSEY')){state = 'New Jersey'}
            console.log(state)
            var dealURL = page.url()
            console.log(dealURL)
            //Set Object Properties
            this.address = address
            this.opid = opid
            this.state = state
            this.deco = deco
            this.note = note

            let alert = `DecoTech?: ${deco} \nDesign Notes: ${note}`
            if(deco == 'true'){dialog.showMessageBox(designwindow, {message: alert})
        console.log('first')}
            if(note.length !== 1){dialog.showMessageBox(designwindow, {message: alert})
            console.log('second')}
            mainwindow.webContents.send('update:address', {msg:this.address})




            


            



        })().catch(err => {
            console.log(err);
    })}
    getProduction(){
        (async () => {

            const browser = await pie.connect(app, puppeteer)
            const page = await pie.getPage(browser, designwindow)
            page.setDefaultTimeout(500)
            try{
                await page.waitForSelector('div.buttons.flex-row')
                await page.click('div.buttons.flex-row')
            }catch{
                await page.waitForSelector('div.cmb-super-group.cmb-super-group-2.cmb-simulation-super-group')
                await page.click('div.cmb-super-group.cmb-super-group-2.cmb-simulation-super-group')
                await page.waitFor(500)
                await page.waitForSelector('div.buttons.flex-row')
                await page.click('div.buttons.flex-row')
            }                      
            await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: productionpath});
            await page.waitFor(500)
            var target = await page.$$('li.dropdown-item')
            await target[15].click()
            
            var element = await page.$('div.flex-column > div:nth-child(1)')
            var fullsystem = await page.evaluate(element => element.textContent, element);
            var element = await page.$('div.flex-column > div:nth-child(2)')
            var panelnumber1 = await page.evaluate(element => element.textContent, element);
            var system1 = fullsystem.replace('system', ' ')
            var panelnumber2 = panelnumber1.replace('panels', ' ')
            var panelnumber = panelnumber2.trim()
            var system = system1.trim()
            console.log(system)
            console.log(panelnumber)
            this.system = system
            this.panelnumber = panelnumber
            await page.waitFor(2000)
            var rawprod = fs.readdirSync(productionpath)
            var wb = xlsx.readFile(path.join(productionpath,rawprod[0]))
            var ws = wb.Sheets["Sheet1"]
            var data = xlsx.utils.sheet_to_json(ws)
            var total1 = data[0]['Energy Production [kWh]'] + data[1]['Energy Production [kWh]']
            var total2 = total1 + data[2]['Energy Production [kWh]']
            var total3 = total2 + data[3]['Energy Production [kWh]']
            var total4 = total3 + data[4]['Energy Production [kWh]']
            var total5 = total4 + data[5]['Energy Production [kWh]']
            var total6 = total5 + data[6]['Energy Production [kWh]']
            var total7 = total6 + data[7]['Energy Production [kWh]']
            var total8 = total7 + data[8]['Energy Production [kWh]']
            var total9 = total8 + data[9]['Energy Production [kWh]']
            var total10 = total9 + data[10]['Energy Production [kWh]']
            var total = total10 + data[11]['Energy Production [kWh]']
            console.log(total)
            data.push({Month:'Total',['Energy Production [kWh]']: total})
            var newData = xlsx.utils.json_to_sheet(data)
            var newCSV = xlsx.utils.sheet_to_csv(newData)
            var newWDPath = path.join(__dirname,'Work Designs')
            var newProdPath = path.join(newWDPath, `${this.system} ${this.address} Production.csv`)
            fs.writeFileSync(newProdPath, newCSV)
            this.productionpath = newProdPath
            var pack = [
                data[0]['Energy Production [kWh]'],
                data[1]['Energy Production [kWh]'],
                data[2]['Energy Production [kWh]'],
                data[3]['Energy Production [kWh]'],
                data[4]['Energy Production [kWh]'],
                data[5]['Energy Production [kWh]'],
                data[6]['Energy Production [kWh]'],
                data[7]['Energy Production [kWh]'],
                data[8]['Energy Production [kWh]'],
                data[9]['Energy Production [kWh]'],
                data[10]['Energy Production [kWh]'],
                data[11]['Energy Production [kWh]']
            ]
            fs.unlinkSync(path.join(productionpath,rawprod[0]))
            this.pack = pack
            console.log(pack)
            mainwindow.webContents.send('update:production', {msg:'Ready', msg2: this.system})

})().catch(err => {
    console.log(err);
})
    }
    getSnips(){
        (async () => {
            const browser = await pie.connect(app, puppeteer)
            const page = await pie.getPage(browser, designwindow)
            var snips = await page.$$('div.proposal-block-wrapper')
            snips[0].screenshot({path: path.join(__dirname,`Work Designs/${this.address} 2d.png`)})
            
            await page.waitFor(500)
            snips[1].screenshot({path: path.join(__dirname,`Work Designs/${this.address} 3d.png`)})
            var snips1 = path.join(__dirname,`Work Designs/${this.address} 2d.png`)
            var snips2 = path.join(__dirname,`Work Designs/${this.address} 3d.png`)
            this.snips1 = snips1
            this.snips2 = snips2
            mainwindow.webContents.send('update:snips', {msg:'Ready'})

})().catch(err => {
    console.log(err);
})
    }
    getUpload(){
        (async () => {
            //Initiate 
            
            const browser = await pie.connect(app, puppeteer)
            const page = await pie.getPage(browser, sfwindow)
            var numb = this.system.split('kW');
            var size = numb[0]
            var wattage = (size/this.panelnumber)*1000
            var watt = Math.ceil(wattage /10)*10
            console.log(watt)
            var state = this.state
            if (state == 'Louisiana'){
                // //Talesun 245W
                // if (watt == '245'){var PanelModel = 'TP660P-245W'}
                // //Hyundai 250W
                // if (watt == '250'){var PanelModel = 'Hyundai 250'} 
                // //SLA260M3A
                // if (watt == '260'){var PanelModel = '4250440'}
                // //Mitsubishi 265W
                // if (watt == '265'){var PanelModel = 'Mitsu 265W'}
                // //Mitsubishi 270W
                // if (watt == '270'){var PanelModel = 'Mitsu 270W'}
                // //Silfab SLA 275M3A
                // if (watt == '275'){var PanelModel = 'SLA275'}
                // //SLA280W
                // if (watt == '280'){var PanelModel = '4250443'}
                // //SLA 285W
                // if (watt == '285'){var PanelModel = '4250446'}
                // //SLA 290W
                // if (watt == '290'){var PanelModel = '4250447'}
                // //SLA 300W
                // if (watt == '300'){var PanelModel = '4250459'}
                // //Hanwha 305W
                // if (watt == '305'){var PanelModel = '4250451'}
                // //SLA 310W
                // if (watt == '310'){var PanelModel = '4250801'}
                // //SLA 320W
                // if (watt == '320'){var PanelModel = '4250809'}
                // //Hanwha 325W
                // if (watt == '325'){var PanelModel = '4250817'}
                // //SLA 330W
                // if (watt == '330'){var PanelModel = '4250473'}
                // //LG 335Wp
                // if (watt == '335'){var PanelModel = '4250467'}
                // //LG 355Wp BOB
                // if (watt == '355'){var PanelModel = '4250464'}
                // //Power XT 360
                // if (watt == '360'){var PanelModel = '4250852'}
                // //Power XT 370
                // if (watt == '370'){var PanelModel = '4250469'}
                if(watt=='360'){var PanelModel = '4250852'}else{var PanelModel = '4250473'}
            }else if(state == 'Connecticut'){
                if(watt=='310'){var PanelModel = '4250801'}else{var PanelModel = '4250473'}
            }else if(state == 'New Jersey'){
                if(watt=='310'){var PanelModel = '4250801'}else{var PanelModel = '4250473'}
            }

            //Pack Matrix
            var pack = this.pack
            var one = JSON.stringify(pack[0])
            var two = JSON.stringify(pack[1])
            var three = JSON.stringify(pack[2])
            var four = JSON.stringify(pack[3])
            var five = JSON.stringify(pack[4])
            var six = JSON.stringify(pack[5])
            var seven = JSON.stringify(pack[6])
            var eight = JSON.stringify(pack[7])
            var nine = JSON.stringify(pack[8])
            var ten = JSON.stringify(pack[9])
            var eleven = JSON.stringify(pack[10])
            var twelve = JSON.stringify(pack[11])

            //Enter Production
            await page.waitForSelector('span.colHeader')
            await page.click('span.colHeader')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(one)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(two)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(three)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(four)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(five)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(six)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(seven)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(eight)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(nine)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(ten)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(eleven)
            await page.keyboard.press('Tab')
            await page.keyboard.press('Tab')
            await page.waitFor(50)
            await page.keyboard.press('Backspace')
            await page.waitFor(50)
            await page.keyboard.type(twelve)


            //Enter Number of Modules
            await page.click('input[id*="numberOfModules"]')
            await page.keyboard.type(this.panelnumber)

            //Enter Panel Module Number
            await page.keyboard.press('Tab')
            await page.keyboard.type(PanelModel)

            const example = await page.$$('div.slds-file-selector');

            const [filechooser1] = await Promise.all([
            page.waitForFileChooser(),
            await example[0].click()
            ])
            await filechooser1.accept([this.snips1])
            const [filechooser2] = await Promise.all([
            page.waitForFileChooser(),
            await example[1].click()
            ])
            await filechooser2.accept([this.snips2])
            const [filechooser3] = await Promise.all([
            page.waitForFileChooser(),
            await example[2].click()
            ])
            await filechooser3.accept([this.productionpath])

            await page.waitFor(500)
            await  page.waitForSelector('input.btn'),
            await  page.click('input.btn')
            await browser.close()
            })().catch(err => {
                console.log(err);
        })
    }
    clearDesign(){
        this.address = ''
        this.design = ''
        this.documents = ''
        this.opid = ''
        this.panelnumber = ''
        this.snips1 = ''
        this.snips2 = ''
        this.state = ''
        this.system = ''
        this.pack = ''
        
    }
    clearProduction(){
        {fs.readdir(productionpath, (err, files) => {
            if (err) throw err;
          
            for (const file of files) {
              fs.unlink(path.join(productionpath, file), err => {
                if (err) throw err;
              });
            }
          });
    }}
    productionMacro(){
        (async () => {

            const browser = await pie.connect(app, puppeteer)
            const page = await pie.getPage(browser, designwindow)
            page.setDefaultTimeout(500)
            try{
                await page.waitForSelector('div.buttons.flex-row')
                await page.click('div.buttons.flex-row')
            }catch{
                await page.waitForSelector('div.cmb-super-group.cmb-super-group-2.cmb-simulation-super-group')
                await page.click('div.cmb-super-group.cmb-super-group-2.cmb-simulation-super-group')
                await page.waitFor(500)
                await page.waitForSelector('div.buttons.flex-row')
                await page.click('div.buttons.flex-row')
            }                      
            await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: productionpath});
            var element = await page.$('div.flex-column > div:nth-child(1)')
            var fullsystem = await page.evaluate(element => element.textContent, element);
            var element = await page.$('div.flex-column > div:nth-child(2)')
            var panelnumber1 = await page.evaluate(element => element.textContent, element);
            var system1 = fullsystem.replace('system', ' ')
            var panelnumber2 = panelnumber1.replace('panels', ' ')
            var panelnumber = panelnumber2.trim()
            var system = system1.trim()
            console.log(system)
            console.log(panelnumber)
            this.system = system
            this.panelnumber = panelnumber
            await page.waitFor(2000)
            var rawprod = fs.readdirSync(productionpath)
            var wb = xlsx.readFile(path.join(productionpath,rawprod[0]))
            var ws = wb.Sheets["Sheet1"]
            var data = xlsx.utils.sheet_to_json(ws)
            var total1 = data[0]['Energy Production [kWh]'] + data[1]['Energy Production [kWh]']
            var total2 = total1 + data[2]['Energy Production [kWh]']
            var total3 = total2 + data[3]['Energy Production [kWh]']
            var total4 = total3 + data[4]['Energy Production [kWh]']
            var total5 = total4 + data[5]['Energy Production [kWh]']
            var total6 = total5 + data[6]['Energy Production [kWh]']
            var total7 = total6 + data[7]['Energy Production [kWh]']
            var total8 = total7 + data[8]['Energy Production [kWh]']
            var total9 = total8 + data[9]['Energy Production [kWh]']
            var total10 = total9 + data[10]['Energy Production [kWh]']
            var total = total10 + data[11]['Energy Production [kWh]']
            console.log(total)
            data.push({Month:'Total',['Energy Production [kWh]']: total})
            var newData = xlsx.utils.json_to_sheet(data)
            var newCSV = xlsx.utils.sheet_to_csv(newData)
            var newWDPath = path.join(__dirname,'Work Designs')
            var newProdPath = path.join(newWDPath, `${this.system} ${this.address} Production.csv`)
            fs.writeFileSync(newProdPath, newCSV)
            this.productionpath = newProdPath
            var pack = [
                data[0]['Energy Production [kWh]'],
                data[1]['Energy Production [kWh]'],
                data[2]['Energy Production [kWh]'],
                data[3]['Energy Production [kWh]'],
                data[4]['Energy Production [kWh]'],
                data[5]['Energy Production [kWh]'],
                data[6]['Energy Production [kWh]'],
                data[7]['Energy Production [kWh]'],
                data[8]['Energy Production [kWh]'],
                data[9]['Energy Production [kWh]'],
                data[10]['Energy Production [kWh]'],
                data[11]['Energy Production [kWh]']
            ]
            fs.unlinkSync(path.join(productionpath,rawprod[0]))
            console.log(pack)
            this.pack = pack
            mainwindow.webContents.send('update:production', {msg:'Ready', msg2: this.system})
    })().catch(err => {
        console.log(err);
})
    }
}


let currentDesign = new Design()


// Listen for app to be ready
app.on('ready', function(){
    //Create new window
    mainwindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true

        },
        frame: false,
        width: 800,
        height: 800
    })


    //Create new window
    designwindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,

        }
    })

    //Create new window
    sfwindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            
        }
    })

    sfwindow.maximize()
    designwindow.maximize()

    sfwindow.webContents.loadURL('https://posigen.my.salesforce.com/00O3o0000055jyB',)

    designwindow.webContents.loadURL('https://app.aurorasolar.com/projects')

    //Load html into window
    mainwindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainwindow.html'),
        protocol: 'FIle:',
        slashes: true
    }))
    //Quit app when closed
    mainwindow.on('closed', function(){
        app.quit()
    })
    globalShortcut.register('CommandOrControl+A', () => {
        currentDesign.clearDesign()
        currentDesign.getNewSalesDesign()  
      })

      globalShortcut.register('CommandOrControl+S', () => {
        currentDesign.clearProduction()
        currentDesign.getProduction()
      })

      globalShortcut.register('CommandOrControl+D', () => {
        currentDesign.getSnips()  
      })
      globalShortcut.register('CommandOrControl+F', () => {
        currentDesign.getUpload()
      })
      globalShortcut.register('CommandOrControl+Q', () => {
        app.quit()
      })
      globalShortcut.register('CommandOrControl+W', () => {
        currentDesign.clearDesign()
        currentDesign.getNewProject()
      })
      globalShortcut.register('CommandOrControl+E', () => {
        currentDesign.setCurrentDesign()  
      })

})
// Listen for web contents being created
app.on('web-contents-created', (e, contents) => {

    // Check for a webview
    if (contents.getType() == 'webview') {
  
      // Listen for any new window events
      contents.on('new-window', (e, url) => {
        e.preventDefault()
        shell.openExternal(url)
      })
    }
  })


//Catch Browser Requests
ipcMain.on('order:add',function(e, order){
    if(order == 'create'){
        console.log('Create Order Recieved!')
        currentDesign.clearDesign()
        currentDesign.getNewSalesDesign()
    }
    if(order == 'upload'){
        console.log('Upload Order Recieved!')
        currentDesign.getUpload()
    }
    if(order == 'snips'){
        console.log('Snips Order Recieved!')
        currentDesign.getSnips()
    }
    if(order == 'production'){
        console.log('Production Order Recieved!')
        currentDesign.clearProduction();
        currentDesign.getProduction()
        
        
    }
    if(order == 'manual'){
        console.log('Manual Production Order Recieved!')
        currentDesign.productionMacro()
        
        
    }
    if(order == 'fromdeal'){
        console.log('Set Order Recieved!')
        currentDesign.clearDesign()
        currentDesign.getNewProject()
    }
    if(order == 'setdeal'){
        console.log('Set Order Recieved!')
        currentDesign.setCurrentDesign()
    }
    if(order == 'clear'){
        console.log('Clear Order Recieved!')
        currentDesign.clearDesign()
        currentDesign.clearProduction()
    }
    
})

app.on('quit', function (){
    
} )
