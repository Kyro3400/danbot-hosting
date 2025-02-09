const fetch = require("node-fetch");

/**
 * @class DanBotHosting
 */
class DanBot {
  /**
   * no shards
   * @param {string} key - your api key prefix by "danbot-""
   * @param {*} client - your discord.js client object
   */
  constructor(key, client) {
    // Check for discord.js
    try {
      this.discord = require("discord.js");
    } catch (e) {
      throw new Error("discord.js is required");
    }

    // Key error handling
    if (!key) throw new Error('"key" is missing or undefined');
    if (typeof key !== "string")
      throw new TypeError('"key" is not typeof string');
    /*if (!key.startsWith("danbot-"))
      throw new Error(
        '"key" is not prefixed by "danbot-", please follow the key format'
      );*/
    // Client error handling
    if (!client) throw new Error('"client" is missing or undefined');
   /* if (!(client instanceof this.discord.Client))
      throw new TypeError('"client" is not a discord.js client'); */

    // API config
    this.baseApiUrl = "https://bot-api.danbot.host";
    this.key = key;
    this.client = client;

    // General config
    this.v12 = this.discord.version <= "14.0.0";
    this.v13 = this.discord.version <= "14.0.0";
    this.v14 = this.discord.version >= "14.0.0";
    this.activeUsers = [];
    this.commandsRun = 0;

    // Check for sharding
    if (this.client.shard) {
      this.sharding = true;

      throw new Error(
        "Please use the sharding client if you wish to use shards"
      );
    } else this.sharding = false;
  }

  async post() {
    // Non-Sharding client
    if (this.sharding)
      return new Error(
        "Please use the statcord sharding client if you wish to use shards"
      );

    // counts
    let guild_count = 0;
    let user_count = 0;

    // v13 code
    if (this.v14) {
      guild_count = this.client.guilds.cache.size;
      user_count = this.client.users.cache.size;
    } else if (this.v13) {
      guild_count = this.client.guilds.cache.size;
      user_count = this.client.users.cache.size;
    } else if (this.v12) {
      // V11 code
      guild_count = this.client.guilds.size;
      user_count = this.client.users.size;
    }
    // Post data
    let requestBody = {
      id: this.client.user.id, // Client id
      key: this.key, // API key
      servers: guild_count.toString(), // Server count
      users: user_count.toString(), // User count
      clientInfo: this.client.user,
      owner_id: "856176853719187506",
      bot_avatar: "https://cdn.discordapp.com/avatars/903067522939646024/a5aa11bc81039b17ed13aeb78d0f9c6c.png"
      //   active: this.activeUsers.length.toString(), // Users that have run commands since the last post
      //  commands: this.commandsRun.toString(), // The how many commands have been run total
    };

    // Reset stats
    this.activeUsers = [];
    this.commandsRun = 0;

    // Create post request
    let response = await fetch(
      this.baseApiUrl + `/addbot?apikey=${key}&discordid=${id}&ownerid=${owner_id}&name=${client.user.username}&avatar=${bot_avatar}&guilds=${client.guilds.cache.size}&users=${client.users.cache.size}&shards=0`,
      {
        method: "post",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Server error
    if (response.status >= 500)
      return new Error(
        `DanBot Hosting server error, statuscode: ${response.status}`
      );

    // Get body as JSON
    let responseData = await response.json();

    // Check response for errors
    if (response.status == 200) {
      // Success
      if (!responseData.error) return Promise.resolve(false);
    } else if (response.status == 400) {
      // Bad request
      if (responseData.error)
        return Promise.resolve(new Error(responseData.message));
    } else if (response.status == 429) {
      // Rate limit hit
      if (responseData.error)
        return Promise.resolve(new Error(responseData.message));
    } else {
      // Other
      return Promise.resolve(new Error("An unknown error has occurred"));
    }
  }

  /**
   * Auto posting
   * @returns {Promise<boolean | Error>} returns false if there was no error, returns an error if there was. Only on the first run, otherwise the rest will be ignored
   */
  async autopost() {
    // Non-Sharding client
    if (this.sharding)
      throw new Error(
        "Please use the sharding client if you wish to use shards"
      );

    console.log("DanBotHosting - Auto Post Started");
    let post = await this.post(); // Create first post

    // set interval to post every hour
    setInterval(async () => {
      await this.post(); // post once every hour
    }, 60000);

    // resolve with initial errors
    return Promise.resolve(post);
  }

  async botInfo() {
    // Create post request
    let response = await fetch(
      this.baseApiUrl + `/bot?apikey=${key}&discordid=${bot_id}&userid=${owner_id}`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Server error
    if (response.status >= 500)
      return new Error(
        `DanBot Hosting server error, statuscode: ${response.status}`
      );

    // Get body as JSON
    let responseData = await response.json();

    // Check response for errors
    if (response.status == 200) {
      // Success
      return Promise.resolve(responseData);

      if (!responseData.error) return Promise.resolve(false);
    } else if (response.status == 400) {
      // Bad request
      if (responseData.error)
        return Promise.resolve(new Error(responseData.message));
    } else if (response.status == 429) {
      // Rate limit hit
      if (responseData.error)
        return Promise.resolve(new Error(responseData.message));
    } else {
      // Other
      return Promise.resolve(new Error("An unknown error has occurred"));
    }
  }
}

// V14 sharding gets
async function getGuildCountV14(client) {
  return (await client.shard.fetchClientValues("guilds.cache.size")).reduce(
    (prev, current) => prev + current,
    0
  );
}

async function getUserCountV14(client) {
  return (await client.shard.fetchClientValues("users.cache.size")).reduce(
    (prev, current) => prev + current,
    0
  );
}
// end

// V13 sharding gets
async function getGuildCountV13(client) {
  return (await client.shard.fetchClientValues("guilds.cache.size")).reduce(
    (prev, current) => prev + current,
    0
  );
}

async function getUserCountV13(client) {
  return (await client.shard.fetchClientValues("users.cache.size")).reduce(
    (prev, current) => prev + current,
    0
  );
}
// end

// v12 sharding gets
async function getGuildCountV12(client) {
  return (await client.shard.fetchClientValues("guilds.size")).reduce(
    (prev, current) => prev + current,
    0
  );
}

async function getUserCountV12(client) {
  return (await client.shard.fetchClientValues("users.size")).reduce(
    (prev, current) => prev + current,
    0
  );
}
//end

module.exports = DanBot;
