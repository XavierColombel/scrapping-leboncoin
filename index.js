const express = require("express");
const app = express();

const scrapeIt = require("scrape-it");
// https://www.npmjs.com/package/scrape-it

/* EXEMPLE DE RECHERCHE */
//https://www.leboncoin.fr/recherche/?text=volvo&category=2&regions=12&departments=75

/* PROMESSE POUR RECUPERER LES URL VERS CHAQUE ANNONCE */
const getArticles = req =>
  new Promise((resolve, reject) => {
    scrapeIt(
      `https://www.leboncoin.fr/recherche/?text=${req.query.text}&category=${
        req.query.category
      }&regions=${req.query.regions}&departments=${req.query.departments}`,
      {
        title: ".bgMain h1",
        articles: {
          listItem: ".react-tabs__tab-panel > div > ul > li",
          data: {
            href: {
              selector: "a",
              attr: "href"
            },
            title: {
              selector: "a",
              attr: "title"
            }
          }
        }
      }
    ).then(({ data, response }) => {
      console.log(`Status Code: ${response.statusCode}`);
      if (response.statusCode !== 200) {
        reject({ error: "Il y a une erreur ! ⚠️" });
      } else {
        resolve(data);
      }
    });
  });

/* PROMESSE POUR RECUPERER LE CONTENU DE CHAQUE ANNONCE */
const getArticle = href =>
  new Promise((resolve, reject) => {
    scrapeIt(`https://www.leboncoin.fr${href}`, {
      title: "h1",
      price: {
        selector:
          "div[data-qa-id='adview_spotlight_description_container'] div[data-qa-id='adview_price']",
        convert: price =>
          Number(price.substring(0, price.length - 2).replace(" ", ""))
      },
      description: {
        selector: "div[data-qa-id='adview_description_container'] > div > span",
        how: "html"
      },
      pictures: {
        listItem:
          "div[data-qa-id='slideshow_thumbnails_container'] span[data-qa-id='slideshow_thumbnails_item']",
        data: {
          picture: {
            selector: "div",
            attr: "style",
            convert: picture =>
              picture === "background-image:none;" ? null : picture
            /* {
              if (picture === "background-image:none;") {
                return null;
              } else {
                return picture;
              }
            } */
          }
        }
      }
    }).then(({ data, response }) => {
      console.log(`Status Code: ${response.statusCode}`);
      if (response.statusCode !== 200) {
        reject({ error: "Il y a une erreur ! ⚠️" });
      } else {
        resolve(data);
      }
    });
  });

/* ROUTE POUR SCRAPPER LEBONCOINCOIN */
app.get("/leboncoin", (req, res) => {
  const ads = [];
  getArticles(req)
    .then(obj => {
      for (let i = 0; i < obj.articles.length; i++) {
        if (obj.articles[i].href !== "") {
          getArticle(obj.articles[i].href)
            .then(result => {
              const { title, description, price, pictures } = result;
              const ad = {
                title,
                description,
                price,
                pictures: pictures.map(obj => {
                  if (obj.picture) {
                    return obj.picture.substring(21, obj.picture.length - 2);
                  } else {
                    return null;
                  }
                })
              };
              ads.push(ad);
              if (i === obj.articles.length - 1) {
                res.json(ads);
              }
            })
            .catch(err => {
              res.json(err);
            });
        }
      }
    })
    .catch(err => {
      res.json(err);
    });
});

app.listen(3200, () => {
  console.log("Server is started! ✌️");
});
