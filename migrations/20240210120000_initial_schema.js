/**
 * @param {import('knex')} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('username').notNullable().unique();
    table.string('password_hash');
    table.string('profile_image');
    table.string('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('friendships', table => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('friend_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('status');
    table.integer('mutual_friends').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'friend_user_id']);
  });

  await knex.schema.createTable('friend_suggestions', table => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('suggested_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.integer('mutual_friends').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'suggested_user_id']);
  });

  await knex.schema.createTable('friend_requests', table => {
    table.increments('id').primary();
    table
      .integer('sender_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('receiver_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.integer('mutual_friends').defaultTo(0);
    table.string('status').defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['sender_user_id', 'receiver_user_id']);
  });

  await knex.schema.createTable('posts', table => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.text('text').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('post_likes', table => {
    table
      .integer('post_id')
      .notNullable()
      .references('id')
      .inTable('posts')
      .onDelete('CASCADE');
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.primary(['post_id', 'user_id']);
  });

  await knex.schema.createTable('comments', table => {
    table.increments('id').primary();
    table
      .integer('post_id')
      .notNullable()
      .references('id')
      .inTable('posts')
      .onDelete('CASCADE');
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.text('text').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('comment_likes', table => {
    table
      .integer('comment_id')
      .notNullable()
      .references('id')
      .inTable('comments')
      .onDelete('CASCADE');
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.primary(['comment_id', 'user_id']);
  });
};

/**
 * @param {import('knex')} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('comment_likes');
  await knex.schema.dropTableIfExists('comments');
  await knex.schema.dropTableIfExists('post_likes');
  await knex.schema.dropTableIfExists('posts');
  await knex.schema.dropTableIfExists('friend_requests');
  await knex.schema.dropTableIfExists('friend_suggestions');
  await knex.schema.dropTableIfExists('friendships');
  await knex.schema.dropTableIfExists('users');
};

