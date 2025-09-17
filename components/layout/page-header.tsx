export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mx-auto w-full  pb-8">
      <h1 className="text-[28px] leading-[34px] tracking-[-0.045rem] text-gray-10 font-medium">
        {title}
      </h1>
      {children && children}
    </div>
  );
}
