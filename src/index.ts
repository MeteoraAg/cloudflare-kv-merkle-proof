import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Env; Variables: {} }>();

app.use('*', async (_c, next) => {
	await next();
});

app.use('/*', cors());

app.get('/:vault_address/:wallet_address', async (ctx) => {
	const vaultAddress = ctx.req.param('vault_address');
	const walletAddress = ctx.req.param('wallet_address');

	const proof = await ctx.env.alpha_vault_merkle_proof.get(`${vaultAddress}-${walletAddress}`);

	if (!proof) {
		return new Response(null, {
			status: 404,
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		});
	}

	return new Response(proof, {
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
	});
});

export default app;
