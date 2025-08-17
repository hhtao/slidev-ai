import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Joi from 'joi';

// 按优先级加载 .env.local -> .env
const root = process.cwd();
['.env.local', '.env'].forEach((file) => {
	const full = path.join(root, file);
	if (fs.existsSync(full)) {
		dotenv.config({ path: full });
	}
});

// 校验必须的环境变量
const schema = Joi.object({
	OPENAI_API_KEY: Joi.string().min(10).required().label('OPENAI_API_KEY'),
	OPENAI_BASE_URL: Joi.string().uri().required().label('OPENAI_BASE_URL'),
	OPENAI_MODEL: Joi.string().required().label('OPENAI_MODEL'),
}).unknown();

const { error } = schema.validate(process.env, { abortEarly: false });
if (error) {
	// eslint-disable-next-line no-console
	console.error('环境变量校验失败:\n' + error.details.map((d) => ` - ${d.context?.label}: ${d.message}`).join('\n'));
	process.exit(1);
}
