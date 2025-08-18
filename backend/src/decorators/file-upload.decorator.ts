import { SsoLite } from '@/utils';
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export function UseFileUploader(fieldName = 'file') {
    return applyDecorators(
        UseInterceptors(
            FileInterceptor(fieldName, {
                storage: diskStorage({
                    destination: SsoLite.root(),
                    filename: (req, file, callback) => {
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const ext = extname(file.originalname);
                        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
                        callback(null, filename);
                    },
                }),
            }),
        ),
    );
}