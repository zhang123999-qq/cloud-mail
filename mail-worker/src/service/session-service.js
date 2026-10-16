import orm from '../entity/orm';
import { eq, sql } from 'drizzle-orm';
import constant from '../const/constant';

// 自定义：session 存 D1，替代 KV，避免部署清空 KV 导致 token 失效
const sessionService = {

	async get(c, userId) {
		const now = Math.floor(Date.now() / 1000);
		const row = await c.env.db.prepare(
			`SELECT data FROM session WHERE user_id = ? AND expire_time > ?`
		).bind(userId, now).first();
		if (!row) return null;
		try {
			return JSON.parse(row.data);
		} catch (e) {
			return null;
		}
	},

	async put(c, userId, data) {
		const expireTime = Math.floor(Date.now() / 1000) + constant.TOKEN_EXPIRE;
		const json = JSON.stringify(data);
		await c.env.db.prepare(
			`INSERT INTO session (user_id, data, expire_time) VALUES (?, ?, ?)
			 ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, expire_time = excluded.expire_time`
		).bind(userId, json, expireTime).run();
	},

	async del(c, userId) {
		await c.env.db.prepare(
			`DELETE FROM session WHERE user_id = ?`
		).bind(userId).run();
	},

	async cleanExpired(c) {
		const now = Math.floor(Date.now() / 1000);
		await c.env.db.prepare(
			`DELETE FROM session WHERE expire_time <= ?`
		).bind(now).run();
	}
};

export default sessionService;
