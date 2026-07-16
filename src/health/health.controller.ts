import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
	@Get()
	health() {
		return {
			status: true,
			message: 'Service is running',
		};
	}
}
