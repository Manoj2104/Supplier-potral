import React from 'react';
import {Helmet} from 'react-helmet';
import {useSelector} from "react-redux";

const TabTitle = (props) => {
    const { title } = props;
    const {frontSetting} = useSelector(state => state)

    const logoUrl = (frontSetting && frontSetting.value && frontSetting.value.logo) ? frontSetting.value.logo : "/favicon.ico";
    const companyName = (frontSetting && frontSetting.value && frontSetting.value.company_name) ? ` | ${frontSetting.value.company_name}` : "";

    return (
        <Helmet>
            <title>{title + companyName}</title>
            <link rel="icon" type="image/png" href={logoUrl} sizes="16x16" />
        </Helmet>
    );
};

export default TabTitle;
