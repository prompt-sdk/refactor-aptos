import ProfileRoot from "@/components/custom/profile-root";

const Profile = async({ params }: { params: any }) => {
  const {id} = await params;
  return <ProfileRoot address={id} />
}

export default Profile;