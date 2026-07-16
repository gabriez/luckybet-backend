// src/types/fastify-cookie.d.ts
import 'fastify';

declare module 'fastify' {
	interface FastifyReply {
		/**
		 * Set response cookie
		 * @name setCookie
		 * @param name Cookie name
		 * @param value Cookie value
		 * @param options Serialize options
		 */
		setCookie: setCookieWrapper;

		/**
		 * @alias setCookie
		 */
		cookie(
			name: string,
			value: string,
			options?: fastifyCookie.CookieSerializeOptions,
		): this;

		/**
		 * clear response cookie
		 * @param name Cookie name
		 * @param options Serialize options
		 */
		clearCookie(name: string, options?: fastifyCookie.CookieSerializeOptions): this;

		/**
		 * Unsigns the specified cookie using the secret provided.
		 * @param value Cookie value
		 */
		unsignCookie(value: string): fastifyCookie.UnsignResult;
	}
}
