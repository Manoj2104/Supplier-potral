import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import RoleForm from './RoleForm';
import { addRole } from '../../store/action/roleAction';
import MasterLayout from '../MasterLayout';
import { fetchPermissions } from '../../store/action/permissionAction';
import { getFormattedMessage, placeholderText } from "../../shared/sharedMethod";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import TabTitle from '../../shared/tab-title/TabTitle';

const CreateRole = (props) => {
    const { addRole, fetchPermissions, permissions = [] } = props;
    const navigate = useNavigate();

    useEffect(() => {
        fetchPermissions();
    }, []);

    const addRolesData = (formValue) => {
        addRole(formValue, navigate);
    };

    const prepareFormOption = {
        addRolesData,
        permissionsArray: permissions
    };

    return (
        <MasterLayout>
            <TopProgressBar />
            <TabTitle title={placeholderText("role.create.title")} />
            <RoleForm {...prepareFormOption} />
        </MasterLayout>
    );
};

const preparePermissions = (permissions) => {
    let permissionArray = [];
    if (!permissions || !Array.isArray(permissions)) return permissionArray;
    permissions.forEach((permission) => {
        const displayName = permission.attributes?.display_name || permission.display_name || permission.name || "";
        permissionArray.push({
            id: permission.id,
            name: displayName
        });
    });
    return permissionArray;
};

const mapStateToProps = (state) => {
    const { permissions } = state;
    return { permissions: preparePermissions(permissions) };
};

export default connect(mapStateToProps, { addRole, fetchPermissions })(CreateRole);
