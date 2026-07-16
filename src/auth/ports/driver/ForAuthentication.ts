export interface ForAuthentication {
	login(username: string, password: string): Promise<{ accessToken: string }>;
	register?: () => Promise<{ user: string }>;
}
