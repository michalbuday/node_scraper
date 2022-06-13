const axios = require('axios').default
const fs = require('fs')
const cheerio = require('cheerio')

const scrapePages = async () => {
    // set pages to scrape
    const pages = 
        ['https://news.ycombinator.com', 
        'https://news.ycombinator.com/news?p=2',
        'https://news.ycombinator.com/news?p=3',
        'https://news.ycombinator.com/news?p=4']

    let allData = [] 

    //extract data from pages
    const requestPages = pages.map(async url => {
        try {
            const res = await axios.get(url)
            const html = await res.data
            const $ = cheerio.load(html)

            let pageData = [];
            
            //find all tr elements
            $('table.itemlist').find('tr').each(function (i, elem) {

                // check for max rank 
                const hasTopHoundred = $(elem).hasClass('athing') &&
                    parseInt($(elem).find('span.rank').text().replace('.','')) > 100

                // stop loop if it was reached
                if (hasTopHoundred) {
                    return false
                }

                let data = {}
                
                // select needed data
                if ($(elem).hasClass('athing')) {
                    data.internalLink = `${url}#${$(elem).attr('id')}`
                    data.title = $(elem).find('.title').text()
                    data.externalLink = $(elem).find('.titlelink').attr('href')
                    pageData.push(data)
                }

                if (!$(elem).hasClass('athing') && !$(elem).hasClass('spacer')) {
                    if ($(elem).find('td.subtext').length !== 0) {
                        pageData[pageData.length-1].dateTime = $(elem).find('.age').attr('title')
                    }
                }
            })

            allData.push(pageData)

        } catch (err) {
            console.error(err)
        }

    })

    //wait for promises to resolve
    await Promise.all(requestPages)

    const jsonData = {
        result: allData
    }

    //write result to file
    fs.writeFileSync('result.json', JSON.stringify(jsonData))
}
// run scrape function
scrapePages()
