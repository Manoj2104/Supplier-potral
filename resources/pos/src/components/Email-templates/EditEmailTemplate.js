import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import HeaderTitle from '../header/HeaderTitle';
import MasterLayout from '../MasterLayout';
import { getFormattedMessage } from '../../shared/sharedMethod';
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import EmailTemplateForm from "./EmailTemplateForm";
import { fetchEmailTemplate } from "../../store/action/emailTemplatesAction";
import FormPageSkeleton from "../../shared/components/skeletons/FormPageSkeleton";
import { isPageFirstLoad, markPageAnimated } from "../dashboard/dashboardAnimationState";

const EditEmailTemplate = ( props ) => {
    const { fetchEmailTemplate, emailTemplates } = props;
    const { id } = useParams();
    const [ isLoadingSkeleton, setIsLoadingSkeleton ] = useState( isPageFirstLoad( 'email-templates-edit' ) );

    useEffect( () => {
        if ( isLoadingSkeleton ) {
            const timer = setTimeout( () => {
                setIsLoadingSkeleton( false );
                markPageAnimated( 'email-templates-edit' );
            }, 1500 );
            return () => clearTimeout( timer );
        }
    }, [ isLoadingSkeleton ] );

    useEffect( () => {
        fetchEmailTemplate( id );
    }, [] );

    const itemsValue = emailTemplates && emailTemplates.length === 1 && emailTemplates.map( emailTemplate => ( {
        name: emailTemplate.attributes.template_name,
        content: emailTemplate.attributes.content,
        id: emailTemplate.id
    } ) );

    return (
        <MasterLayout>
            <TopProgressBar />
            <HeaderTitle title={getFormattedMessage( 'email-template.edit.title' )} to='/app/email-templates' />
            {isLoadingSkeleton || emailTemplates.length !== 1 ? (
                <FormPageSkeleton />
            ) : (
                <EmailTemplateForm singleEmailTemplate={itemsValue} id={id} />
            )}
        </MasterLayout>
    )
};

const mapStateToProps = ( state ) => {
    const { emailTemplates } = state;
    return { emailTemplates }
};

export default connect( mapStateToProps, { fetchEmailTemplate } )( EditEmailTemplate );

