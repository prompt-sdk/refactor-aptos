import { FC } from 'react';

import { ComponentBaseProps } from '@/components/common/interface/component.interface';
import ImageBoder from '@/public/assets/svgs/profile-top-frame-border.svg';

import { cn } from '../utils/utils';


type BoderImageProps = ComponentBaseProps & {
  children?: React.ReactNode;
  imageBoder?: string;
};

const BoderImage: FC<BoderImageProps> = ({ className, children, imageBoder, ...rest }) => {
  return (
    <div
      style={{ borderImageSource: `url("${imageBoder || ImageBoder.src}")` }}
      className={cn(
        'border-8 p-0 [border-image-repeat:stretch] [border-image-slice:11_fill] [border-image-width:11px]',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default BoderImage;
