
import ProfileInfor from '@/components/custom/profile-infor';
import ProfileWidget from '@/components/custom/profile-widget';
import { getUser } from '@/db/queries';

const Profile = async ({ params }: { params: any }) => {
  const { address } = await params;
  const [user] = await getUser(address)
  //get userId by username ;
  return (
    <div className={'flex w-full grow items-center justify-center py-4'}>
      <div className="container flex flex-col items-center justify-center gap-6">
        <ProfileInfor address={address} />
        <ProfileWidget user={user} />
      </div>
    </div>
  )
}

export default Profile;