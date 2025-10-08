import Header from '../Core/Header';
import Footer from '../Core/Footer';

const Layout = ({ children }: React.PropsWithChildren<{}>) => {
  return (
    <>
      <Header />
      {/* Compensa a altura do header fixo: 4rem mobile, 8rem desktop */}
      <div className="flex mt-16 lg:mt-32 max-w-[1566px] mx-auto">{children}</div>
      <Footer />
    </>
  );
};

export default Layout;
