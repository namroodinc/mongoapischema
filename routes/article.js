import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

const bodyParserLimit = bodyParser.json({
  limit: '50mb'
});
const route = express.Router();

import articleModel from '../models/articleModel';
const { Author, Article } = articleModel;

import options from '../constants/options';

route.post('/create/article', bodyParserLimit, (req, res) => {

  const creationDetails = {
    dateCreated: Date.now(),
    dateModified: Date.now()
  };

  const authors = req.body.authors.map(author => {
    return new Author({
      _id: new mongoose.Types.ObjectId(),
      name: author,
      publication: req.body.publication
    })
  });

  mongoose.connect(process.env.MONGODB_URI, options, function(error) {
    if (error) {
      res
        .status(500)
        .send(error.message)
    } else {
      saveArticle();
    }
  });

  function saveArticle() {

    const authorSave = authors.map(author => {
      return new Promise((resolve, reject) => {

        const authorQuery = Author.findOne({
          name: author.name
        });

        authorQuery.exec((err, person) => {
          console.log('------------');

          if (person !== null) {
            console.log('not creating new: ', author.name);
            resolve(author)
          } else {
            console.log('creating new: ', author.name);
            author.save((err) => {
              if (err) reject();
              resolve(author);
            });
          }
        });

      });
    });

    return Promise.all(authorSave)
      .then(data => {
        const article = new Article(
          Object
            .assign(
              creationDetails,
              req.body,
              {
                authors: data.map(data => data._id)
              }
            )
        );

        article.save((err, mongoResponse) => {
          if (err) {
            res
              .status(500)
              .send(err.message);
          } else {
            res
              .status(200)
              .send({
                id: mongoResponse._id.toString(),
                message: "Article has been created"
              });
          }
        });
      });
  }

});

// TODO: this needs implementing
route.post('/retrieve/article/:articleId', bodyParserLimit, (req, res) => {
  console.log(req.params.articleId);
});

// TODO: this needs implementing
route.post('/update/article/:articleId', bodyParserLimit, (req, res) => {
  console.log(req.params.articleId);
});

export default route;
