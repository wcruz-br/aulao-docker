const { expect } = require('chai');
const models = require('../models/post');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const sequelize = require('sequelize');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Post Model Integration Tests', function () {
  this.timeout(60000);

  before(async () => {

    const container = await new PostgreSqlContainer().start();

    DB_DATABASE = container.getDatabase();
    DB_USERNAME = container.getUsername();
    DB_PASSWORD = container.getPassword();
    DB_HOST = container.getHost();
    DB_PORT = container.getPort();
    DB_SSL_REQUIRE = false;

    console.log('Initializing Database...');

    const seque = new sequelize.Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'postgres',
      dialectOptions: {
        ssl: DB_SSL_REQUIRE ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    });

    await models.initDatabase(seque);

    // Adiciona um atraso de 2 segundos (2000 ms) após a inicialização do banco
    console.log('Waiting for the database to stabilize...');
    await sleep(2000);
  });

  after(async () => {
    console.log('Closing Database Connection...');
    if (models.seque) {
      await models.seque.close();
    }
  });

  beforeEach(async () => {
    // Limpa os dados antes de cada teste
    const lista = await models.Post.findAll();
    if (lista.length > 0) {
      await models.Post.destroy({ where: {}, truncate: true });
    }
    // await models.Post.destroy({ where: {}, truncate: true });
  });

  it('should create a new Post', async () => {
    console.log('Test: Create a new Post');
    const post = await models.Post.create({
      title: 'First Post',
      summary: 'This is the first post',
      publishDate: '2024-11-20',
      content: 'Detailed content for the first post.',
    });

    expect(post).to.not.be.null; // O objeto não deve ser nulo
    expect(post).to.have.property('id'); // O objeto deve conter a propriedade 'id'
    expect(post.title).to.equal('First Post'); // O título deve ser igual ao esperado
  });

  it('should read a Post from the database', async () => {
    console.log('Test: Read Post from Database');
    // Insere um dado para garantir que o estado é correto
    await models.Post.create({
      title: 'Read Test',
      summary: 'This is a read test post',
      publishDate: '2024-11-20',
      content: 'Detailed content for the read test post.',
    });

    const post = await models.Post.findOne({ where: { title: 'Read Test' } });
    expect(post).to.not.be.null;
    expect(post.title).to.equal('Read Test');
    expect(post.summary).to.equal('This is a read test post');
  });

  it('should update a Post', async () => {
    console.log('Test: Update a Post');
    const post = await models.Post.create({
      title: 'Update Test',
      summary: 'This is a post to update',
      publishDate: '2024-11-20',
      content: 'Detailed content for the update test post.',
    });

    post.summary = 'Updated summary for the update test post';
    await post.save();

    const updatedPost = await models.Post.findOne({ where: { title: 'Update Test' } });
    expect(updatedPost.summary).to.equal('Updated summary for the update test post');
  });

  it('should delete a Post', async () => {
    console.log('Test: Delete a Post');
    const post = await models.Post.create({
      title: 'Delete Test',
      summary: 'This is a post to delete',
      publishDate: '2024-11-20',
      content: 'Detailed content for the delete test post.',
    });

    await post.destroy();

    const deletedPost = await models.Post.findOne({ where: { title: 'Delete Test' } });
    expect(deletedPost).to.be.null;
  });
});
