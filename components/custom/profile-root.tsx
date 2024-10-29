'use client';

import { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import ProfileInfor from './profile-infor';
import ProfileWidget from './profile-widget';
type ProfileRootProps ={
  address: string;
  className?: string
};

const ProfileRoot: FC<ProfileRootProps> = ({ className, address }) => {
  return (
    <div className={classNames('flex w-full grow items-center justify-center py-4', className)}>
      <div className="container flex flex-col items-center justify-center gap-6">
        <ProfileInfor address={address} />
        <ProfileWidget address={address} />
      </div>
    </div>
  );
};

export default ProfileRoot;
