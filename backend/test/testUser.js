const mongoose = require('mongoose');
const UserDB = require('../models/User');

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../app');

chai.use(chaiHttp);

describe('books', () => {
    beforeEach((done) => {
        UserDB.remove({}, (err) => {
           done();
        });
    });

    describe("post '/'", () => {
        it('Should be able to create user', (done) => {
            let user = {
                firstName: "admin",
                lastName: "admin",
                email: "admin@mail.com",
                loginType: "email",
                password: "admin"
            }
            chai.request(server)
                .post('/api/users/')
                .send(user)
                .end((err, res) => {
                    console.log(res.body);
                    done();
                })
        })
    })
})