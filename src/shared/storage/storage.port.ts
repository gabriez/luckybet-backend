export type MissionImageFolder = 'missions' | 'steps';

export type UploadableFile = {
	buffer: Buffer;
	filename: string;
	mimetype: string;
};

export interface StorageService {
	buildPublicUrl(key: string): string;

	uploadImage(file: UploadableFile, folder: MissionImageFolder): Promise<string>;

	replaceImage(
		file: UploadableFile,
		folder: MissionImageFolder,
		existingUrl: string,
	): Promise<string>;

	deleteImage(url: string): Promise<void>;
}
