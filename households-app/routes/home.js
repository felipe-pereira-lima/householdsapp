'use strict';

const { Router } = require('express');
const routeGuard = require('./../middleware/route-guard');
const router = new Router();
const User = require('../models/User');

const Home = require('../models/Home');
const Task = require('../models/Task');

router.get('/create', (req, res) => {
  res.render('./home/home-create');
});

router.post('/create', routeGuard(true), (req, res, next) => {
  const userId = req.user._id;
  //console.log(req.body);
  const { address, zipcode, phone, name } = req.body;
  Home.create({
    name,
    members: [userId],
    address,
    zipcode,
    phone
  })
    .then(home => {
      console.log('should redirect');
      res.redirect(`/dashboard`);
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:homeId/edit', (req, res, next) => {
  const { homeId } = req.params;

  Home.findOne({
    _id: homeId
  })
    .then(home => {
      if (home) {
        res.render('home/home-single-edit', { home });
      } else {
        next(new Error('NOT_FOUND'));
      }
    })
    .catch(error => {
      next(error);
    });
});

router.post('/:homeId/edit', routeGuard(true), (req, res, next) => {
  const { homeId } = req.params;
  const { address, zipcode, phone, name } = req.body;

  /*
  here you will receive a user email with req.body.member
  first you will have to find that user in the data base to access the user_id.
  after finding the user, find the home and update it with all the information
*/

  Home.findOneAndUpdate(
    {
      _id: homeId
    },
    {
      name,
      address,
      //TODO - Push members
      zipcode,
      phone
    }
  )
    .then(() => {
      res.redirect(`/home/${homeId}`);
    })
    .catch(error => {
      next(error);
    });
});

router.post('/:homeId/delete', routeGuard(true), (req, res, next) => {
  Home.deleteOne({ _id: req.params.homeId })
    .then(deleted => {
      console.log('deleted', deleted);
      res.redirect('/dashboard');
    })
    .catch(error => {
      console.log(error);

      next(error);
    });
});

router.get('/:homeId', routeGuard(true), (req, res, next) => {
  const homeId = req.params.homeId;
  let home;
  Home.findById(homeId)
    .populate('members')
    .then(homeInfo => {
      home = homeInfo;
      return Task.find({ home: homeId });
    })
    .then(tasks => {
      console.log(home);
      res.render('./home/home-single', { home, tasks });
    })
    .catch(error => next(error));
});

router.post('/invite/:homeId', routeGuard(true), (req, res, next) => {
  const homeId = req.params.homeId;
  console.log(req.body, homeId);
  User.find({ email: req.body.email })
    .then(user => {
      Home.findByIdAndUpdate(homeId, { $push: { members: user } }).then(() => {
        res.redirect('/home/' + homeId);
      });
    })
    .catch(error => next(error));
});
module.exports = router;
