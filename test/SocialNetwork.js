const { assert } = require('chai');

const SocialNetwork = artifacts.require("SocialNetwork");

require('chai').use(require('chai-as-promised')).should()

contract('SocialNetwork', ([deployer, author, tipper]) => {
    let socialNet

    before(async () => {
        socialNet = await SocialNetwork.deployed()
    })

    describe('deployment', async () => {
        it('deploy successfully', async () => {
            const address = await socialNet.address

            assert.notEqual(address, 0x0)
            assert.notEqual(address, null)
            assert.notEqual(address, '')
            assert.notEqual(address, undefined)

        })

        it('has a name', async () => {
            const name = await socialNet.name()
            assert.equal(name, 'Dapp University Social Network')
            assert.notEqual(name, '')
            assert.notEqual(name, null)
            assert.notEqual(name, undefined)
        })
    })

    describe('posts', async () => {
        let result, postCount

        before( async () => {
            result = await socialNet.createPost('This is my first post', { from: author })
            postCount = await socialNet.postCount();
        })

        it('create posts', async () => {
            
            //SUCCESS
            assert.equal(postCount, 1)
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), postCount.toNumber(), 'Id is correct')
            assert.equal(event.content, 'This is my first post', 'content is correct')
            assert.equal(event.tipAmount, '0', 'Tip amount is correct')
            assert.equal(event.author, author, 'Author is correct')
            //FAILURE
            await socialNet.createPost('', {form : author}).should.be.rejected;
        })

        it('lists posts', async () => {
            const post = await socialNet.posts(postCount);
            assert.equal(post.id.toNumber(), postCount.toNumber(), 'Id is correct')
            assert.equal(post.content, 'This is my first post', 'content is correct')
            assert.equal(post.tipAmount, '0', 'Tip amount is correct')
            assert.equal(post.author, author, 'Author is correct')
        })

        it('allow users to tip posts', async () => {
            let oldAuthorBalance
            oldAuthorBalance = await web3.eth.getBalance(author)
            oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)

            result = await socialNet.tipPost(postCount, { from: tipper, value: web3.utils.toWei('1','Ether') })
            //SUCCESS
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), postCount.toNumber(), 'Id is correct')
            assert.equal(event.content, 'This is my first post', 'content is correct')
            assert.equal(event.tipAmount, '1000000000000000000', 'Tip amount is correct')
            assert.equal(event.author, author, 'Author is correct')

            let newAuthorBalance
            newAuthorBalance = await web3.eth.getBalance(author)
            newAuthorBalance = new web3.utils.BN(newAuthorBalance)

            let tipAmount
            tipAmount = await web3.utils.toWei('1','Ether')
            tipAmount = new web3.utils.BN(tipAmount)

            const expectedBalance = oldAuthorBalance.add(tipAmount);
            assert.equal(newAuthorBalance.toString(), expectedBalance.toString(),'tip added')

            //FAILURE: tries to post a post that doesn't exist
            await socialNet.tipPost(99,{ from: tipper, value: web3.utils.toWei('1','Ether') }).should.be.rejected

        })
    })
})

